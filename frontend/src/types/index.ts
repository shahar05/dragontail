export interface Store {
  id: number;
  name: string;
  location: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  created_at: string;
}

export interface HourlyForecast {
  hour: number;
  predicted_quantity: number;
}

export interface ProductForecast {
  product_id: number;
  product_name: string;
  category: string;
  hourly_data: HourlyForecast[];
}

export interface ForecastResponse {
  store_id: number;
  store_name: string;
  forecast_date: string;
  products: ProductForecast[];
}
