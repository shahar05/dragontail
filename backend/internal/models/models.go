package models

import "time"

type Store struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Location  string    `json:"location" db:"location"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Product struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Category  string    `json:"category" db:"category"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type SalesHistory struct {
	ID        int       `json:"id" db:"id"`
	StoreID   int       `json:"store_id" db:"store_id"`
	ProductID int       `json:"product_id" db:"product_id"`
	SaleDate  time.Time `json:"sale_date" db:"sale_date"`
	SaleHour  int       `json:"sale_hour" db:"sale_hour"`
	Quantity  int       `json:"quantity" db:"quantity"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Forecast struct {
	ID                int       `json:"id" db:"id"`
	StoreID           int       `json:"store_id" db:"store_id"`
	ProductID         int       `json:"product_id" db:"product_id"`
	ForecastDate      time.Time `json:"forecast_date" db:"forecast_date"`
	Hour              int       `json:"hour" db:"hour"`
	PredictedQuantity float64   `json:"predicted_quantity" db:"predicted_quantity"`
	GeneratedAt       time.Time `json:"generated_at" db:"generated_at"`
}

type ForecastResponse struct {
	StoreID      int               `json:"store_id"`
	StoreName    string            `json:"store_name"`
	ForecastDate string            `json:"forecast_date"`
	Products     []ProductForecast `json:"products"`
}

type ProductForecast struct {
	ProductID   int              `json:"product_id"`
	ProductName string           `json:"product_name"`
	Category    string           `json:"category"`
	HourlyData  []HourlyForecast `json:"hourly_data"`
}

type HourlyForecast struct {
	Hour              int     `json:"hour"`
	PredictedQuantity float64 `json:"predicted_quantity"`
}
