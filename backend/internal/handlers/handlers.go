package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shahar05/dragontail/backend/internal/forecast"
	"github.com/shahar05/dragontail/backend/internal/models"
	"github.com/shahar05/dragontail/backend/internal/repository"
)

type Handler struct {
	repo      *repository.Repository
	generator *forecast.Generator
}

func New(repo *repository.Repository, gen *forecast.Generator) *Handler {
	return &Handler{repo: repo, generator: gen}
}

func (h *Handler) GetStores(c *gin.Context) {
	stores, err := h.repo.GetAllStores()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if stores == nil {
		c.JSON(http.StatusOK, []models.Store{})
		return
	}
	c.JSON(http.StatusOK, stores)
}

func (h *Handler) GetProducts(c *gin.Context) {
	products, err := h.repo.GetAllProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if products == nil {
		c.JSON(http.StatusOK, []models.Product{})
		return
	}
	c.JSON(http.StatusOK, products)
}

func (h *Handler) GetForecast(c *gin.Context) {
	storeIDStr := c.Query("store_id")
	dateStr := c.Query("date")

	if storeIDStr == "" || dateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "store_id and date are required"})
		return
	}

	storeID, err := strconv.Atoi(storeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid store_id"})
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}

	summary, err := h.repo.GetForecastSummary(storeID, date)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

func (h *Handler) GetForecastDates(c *gin.Context) {
	storeIDStr := c.Query("store_id")

	if storeIDStr == "" {
		dates, err := h.repo.GetForecastDates()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if dates == nil {
			dates = []string{}
		}
		c.JSON(http.StatusOK, dates)
		return
	}

	storeID, err := strconv.Atoi(storeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid store_id"})
		return
	}

	dates, err := h.repo.GetAvailableForecastDates(storeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if dates == nil {
		dates = []string{}
	}
	c.JSON(http.StatusOK, dates)
}

func (h *Handler) TriggerForecastGeneration(c *gin.Context) {
	dateStr := c.Query("date")
	var targetDate time.Time

	if dateStr == "" {
		targetDate = time.Now().AddDate(0, 0, 1)
	} else {
		var err error
		targetDate, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format"})
			return
		}
	}

	go func() {
		if err := h.generator.GenerateForDate(targetDate); err != nil {
			log.Printf("Forecast generation error for %s: %v", targetDate.Format("2006-01-02"), err)
		}
	}()

	c.JSON(http.StatusAccepted, gin.H{
		"message": "Forecast generation started",
		"date":    targetDate.Format("2006-01-02"),
	})
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
