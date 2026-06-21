# KFC Sales Forecast System

A full-stack service that predicts daily sales for KFC restaurant stores, helping cooks prepare products in advance and reduce waste.

## Architecture

| Layer     | Technology            |
|-----------|-----------------------|
| Backend   | Go 1.21 + Gin         |
| Frontend  | React 18 + TypeScript |
| Database  | PostgreSQL 16         |
| Container | Docker + Compose      |

## Features

- **Daily forecast generation** — runs automatically at midnight (configurable cron schedule)
- **Average-based algorithm** — uses historical sales data averaged by store / product / hour / day-of-week
- **Per-hour predictions** — 24-hour breakdown for each product in each store
- **REST API** — query forecasts by store and date
- **Responsive UI** — store list, date picker, hourly bar charts, KFC branding
- **Persistent preferences** — selected store and date survive page reloads (localStorage)

## Quick Start

```bash
docker compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **PostgreSQL**: localhost:5432

The database is seeded automatically with 5 KFC stores, 15 products, and 8 weeks of synthetic sales history. Forecasts for the next 7 days are generated on first startup.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/stores | List all stores |
| GET | /api/products | List all products |
| GET | /api/forecasts?store_id=1&date=2024-01-15 | Get forecast for store + date |
| GET | /api/forecasts/dates?store_id=1 | Get available forecast dates |
| POST | /api/forecasts/generate?date=2024-01-15 | Trigger forecast generation |

## Configuration

Edit `backend/config/config.yaml` to adjust:

```yaml
forecast:
  schedule: "0 0 * * *"   # Cron: daily at midnight
  history_weeks: 4          # Weeks of history used for averaging
```

Environment variable overrides: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SERVER_PORT`.

## Project Structure

```
├── backend/
│   ├── cmd/server/main.go          # Entry point
│   ├── config/config.yaml          # Application config
│   ├── internal/
│   │   ├── config/                 # Config loader (Viper)
│   │   ├── database/               # DB connection
│   │   ├── forecast/               # Forecast generator + scheduler
│   │   ├── handlers/               # HTTP handlers (Gin)
│   │   ├── models/                 # Data models
│   │   └── repository/             # DB queries
│   └── migrations/                 # SQL migrations + seed data
├── frontend/
│   └── src/
│       ├── App.tsx                 # Main application
│       ├── api/                    # API client (axios)
│       └── types/                  # TypeScript interfaces
└── docker-compose.yml
```
