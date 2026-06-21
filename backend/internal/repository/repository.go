package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/shahar05/dragontail/backend/internal/models"
)

type Repository struct {
	db *sql.DB
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAllStores() ([]models.Store, error) {
	rows, err := r.db.Query(`SELECT id, name, location, created_at FROM stores ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stores []models.Store
	for rows.Next() {
		var s models.Store
		if err := rows.Scan(&s.ID, &s.Name, &s.Location, &s.CreatedAt); err != nil {
			return nil, err
		}
		stores = append(stores, s)
	}
	return stores, rows.Err()
}

func (r *Repository) GetStoreByID(id int) (*models.Store, error) {
	var s models.Store
	err := r.db.QueryRow(`SELECT id, name, location, created_at FROM stores WHERE id = $1`, id).
		Scan(&s.ID, &s.Name, &s.Location, &s.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &s, err
}

func (r *Repository) GetAllProducts() ([]models.Product, error) {
	rows, err := r.db.Query(`SELECT id, name, category, created_at FROM products ORDER BY category, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.CreatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *Repository) GetForecastsByStoreAndDate(storeID int, date time.Time) ([]models.Forecast, error) {
	rows, err := r.db.Query(`
		SELECT id, store_id, product_id, forecast_date, hour, predicted_quantity, generated_at
		FROM forecasts
		WHERE store_id = $1 AND forecast_date = $2
		ORDER BY product_id, hour
	`, storeID, date.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var forecasts []models.Forecast
	for rows.Next() {
		var f models.Forecast
		if err := rows.Scan(&f.ID, &f.StoreID, &f.ProductID, &f.ForecastDate, &f.Hour, &f.PredictedQuantity, &f.GeneratedAt); err != nil {
			return nil, err
		}
		forecasts = append(forecasts, f)
	}
	return forecasts, rows.Err()
}

func (r *Repository) GetAvailableForecastDates(storeID int) ([]string, error) {
	rows, err := r.db.Query(`
		SELECT DISTINCT forecast_date::text
		FROM forecasts
		WHERE store_id = $1
		ORDER BY forecast_date
	`, storeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dates []string
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err != nil {
			return nil, err
		}
		if len(d) >= 10 {
			dates = append(dates, d[:10])
		}
	}
	return dates, rows.Err()
}

func (r *Repository) GetHistoricalAverages(storeID, productID, dayOfWeek, hour int, weeksBack int) (float64, error) {
	var avg sql.NullFloat64
	err := r.db.QueryRow(`
		SELECT AVG(quantity)
		FROM sales_history
		WHERE store_id = $1
		  AND product_id = $2
		  AND EXTRACT(DOW FROM sale_date) = $3
		  AND sale_hour = $4
		  AND sale_date >= CURRENT_DATE - ($5 * 7)
	`, storeID, productID, dayOfWeek, hour, weeksBack).Scan(&avg)
	if err != nil {
		return 0, err
	}
	if !avg.Valid {
		return 0, nil
	}
	return avg.Float64, nil
}

func (r *Repository) GetAllStoreIDs() ([]int, error) {
	rows, err := r.db.Query(`SELECT id FROM stores`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *Repository) GetAllProductIDs() ([]int, error) {
	rows, err := r.db.Query(`SELECT id FROM products`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *Repository) UpsertForecast(f models.Forecast) error {
	_, err := r.db.Exec(`
		INSERT INTO forecasts (store_id, product_id, forecast_date, hour, predicted_quantity, generated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (store_id, product_id, forecast_date, hour)
		DO UPDATE SET predicted_quantity = EXCLUDED.predicted_quantity, generated_at = NOW()
	`, f.StoreID, f.ProductID, f.ForecastDate.Format("2006-01-02"), f.Hour, f.PredictedQuantity)
	return err
}

func (r *Repository) GetProductByID(id int) (*models.Product, error) {
	var p models.Product
	err := r.db.QueryRow(`SELECT id, name, category, created_at FROM products WHERE id = $1`, id).
		Scan(&p.ID, &p.Name, &p.Category, &p.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return &p, err
}

func (r *Repository) GetForecastDates() ([]string, error) {
	rows, err := r.db.Query(`
		SELECT DISTINCT forecast_date::text FROM forecasts ORDER BY forecast_date
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dates []string
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err != nil {
			return nil, err
		}
		if len(d) >= 10 {
			dates = append(dates, d[:10])
		}
	}
	return dates, rows.Err()
}

func (r *Repository) HasForecastForDate(date time.Time) (bool, error) {
	var count int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM forecasts WHERE forecast_date = $1
	`, date.Format("2006-01-02")).Scan(&count)
	return count > 0, err
}

func (r *Repository) GetForecastSummary(storeID int, date time.Time) (*models.ForecastResponse, error) {
	store, err := r.GetStoreByID(storeID)
	if err != nil {
		return nil, err
	}
	if store == nil {
		return nil, fmt.Errorf("store %d not found", storeID)
	}

	forecasts, err := r.GetForecastsByStoreAndDate(storeID, date)
	if err != nil {
		return nil, err
	}

	productMap := make(map[int]*models.ProductForecast)
	productOrder := []int{}

	for _, f := range forecasts {
		if _, exists := productMap[f.ProductID]; !exists {
			product, err := r.GetProductByID(f.ProductID)
			if err != nil || product == nil {
				continue
			}
			productMap[f.ProductID] = &models.ProductForecast{
				ProductID:   product.ID,
				ProductName: product.Name,
				Category:    product.Category,
				HourlyData:  []models.HourlyForecast{},
			}
			productOrder = append(productOrder, f.ProductID)
		}
		productMap[f.ProductID].HourlyData = append(productMap[f.ProductID].HourlyData, models.HourlyForecast{
			Hour:              f.Hour,
			PredictedQuantity: f.PredictedQuantity,
		})
	}

	products := make([]models.ProductForecast, 0, len(productOrder))
	for _, pid := range productOrder {
		products = append(products, *productMap[pid])
	}

	return &models.ForecastResponse{
		StoreID:      store.ID,
		StoreName:    store.Name,
		ForecastDate: date.Format("2006-01-02"),
		Products:     products,
	}, nil
}
