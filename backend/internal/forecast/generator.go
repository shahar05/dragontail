package forecast

import (
	"fmt"
	"log"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/shahar05/dragontail/backend/internal/models"
	"github.com/shahar05/dragontail/backend/internal/repository"
)

type Generator struct {
	repo         *repository.Repository
	historyWeeks int
	scheduler    *cron.Cron
}

func NewGenerator(repo *repository.Repository, historyWeeks int) *Generator {
	return &Generator{
		repo:         repo,
		historyWeeks: historyWeeks,
	}
}

func (g *Generator) Start(schedule string) error {
	g.scheduler = cron.New()
	_, err := g.scheduler.AddFunc(schedule, func() {
		log.Println("Running scheduled forecast generation...")
		if err := g.GenerateForDate(time.Now().AddDate(0, 0, 1)); err != nil { // Generate forecast for the next day
			log.Printf("Forecast generation error: %v", err)
		}
	})
	if err != nil {
		return fmt.Errorf("invalid cron schedule: %w", err)
	}
	g.scheduler.Start()
	log.Printf("Forecast scheduler started with schedule: %s", schedule)
	return nil
}

func (g *Generator) Stop() {
	if g.scheduler != nil {
		ctx := g.scheduler.Stop() // Wait for all running jobs to finish
		<-ctx.Done() // channel will be closed when all jobs are done
        log.Println("Forecast scheduler stopped.")
	}
}

func (g *Generator) GenerateForDate(date time.Time) error {
	targetDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC) // Normalize to midnight UTC
	dayOfWeek := int(targetDate.Weekday()) // 0=Sunday, 1=Monday, ..., 6=Saturday   

	storeIDs, err := g.repo.GetAllStoreIDs() // Fetch all store IDs from the repository
	if err != nil {
		return fmt.Errorf("failed to get stores: %w", err)
	}

	productIDs, err := g.repo.GetAllProductIDs() // Fetch all product IDs from the repository
	if err != nil {
		return fmt.Errorf("failed to get products: %w", err)
	}

	count := 0
	for _, storeID := range storeIDs { // Iterate over each store
		for _, productID := range productIDs { // Iterate over each product
			for hour := 0; hour < 24; hour++ { // Iterate over each hour of the day
				avg, err := g.repo.GetHistoricalAverages(storeID, productID, dayOfWeek, hour, g.historyWeeks)
				if err != nil {
					log.Printf("Warning: failed to get avg for store=%d product=%d hour=%d: %v", storeID, productID, hour, err)
					continue
				}

				forecast := models.Forecast{
					StoreID:           storeID,
					ProductID:         productID,
					ForecastDate:      targetDate,
					Hour:              hour,
					PredictedQuantity: avg,
				}

				if err := g.repo.UpsertForecast(forecast); err != nil {
					log.Printf("Warning: failed to upsert forecast: %v", err)
					continue
				}
				count++
			}
		}
	}

	log.Printf("Generated %d forecast entries for %s", count, targetDate.Format("2006-01-02"))
	return nil
}

func (g *Generator) GenerateInitial() error {
	log.Println("Generating initial forecasts...")
	for i := 1; i <= 7; i++ {
		date := time.Now().AddDate(0, 0, i)
		if err := g.GenerateForDate(date); err != nil {
			log.Printf("Warning: failed to generate forecast for %s: %v", date.Format("2006-01-02"), err)
		}
	}
	return nil
}
