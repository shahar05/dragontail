package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/shahar05/dragontail/backend/internal/config"
	"github.com/shahar05/dragontail/backend/internal/database"
	"github.com/shahar05/dragontail/backend/internal/forecast"
	"github.com/shahar05/dragontail/backend/internal/handlers"
	"github.com/shahar05/dragontail/backend/internal/repository"
)

func main() {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "/app/config/config.yaml"
	}

	cfg, err := config.Load(configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	gin.SetMode(cfg.Server.Mode) // Release mode for production, debug mode for development

	db, err := database.Connect(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	repo := repository.New(db)
	gen := forecast.NewGenerator(repo, cfg.Forecast.HistoryWeeks)

	if err := gen.GenerateInitial(); err != nil {
		log.Printf("Warning: initial forecast generation failed: %v", err)
	}

	if err := gen.Start(cfg.Forecast.Schedule); err != nil {
		log.Printf("Warning: failed to start forecast scheduler: %v", err)
	}
	defer gen.Stop()

	h := handlers.New(repo, gen)
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	api := r.Group("/api")
	{
		api.GET("/health", h.HealthCheck)
		api.GET("/stores", h.GetStores)
		api.GET("/products", h.GetProducts)
		api.GET("/forecasts", h.GetForecast)
		api.GET("/forecasts/dates", h.GetForecastDates)
		api.POST("/forecasts/generate", h.TriggerForecastGeneration)
	}

	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
