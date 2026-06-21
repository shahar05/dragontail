-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create sales_history table
CREATE TABLE IF NOT EXISTS sales_history (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    sale_date DATE NOT NULL,
    sale_hour INTEGER NOT NULL CHECK (sale_hour >= 0 AND sale_hour <= 23),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_history_store_product ON sales_history(store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_date ON sales_history(sale_date);

-- Create forecasts table
CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    forecast_date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    predicted_quantity FLOAT NOT NULL DEFAULT 0,
    generated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(store_id, product_id, forecast_date, hour)
);

CREATE INDEX IF NOT EXISTS idx_forecasts_store_date ON forecasts(store_id, forecast_date);
