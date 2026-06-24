# KFC Sales Forecast System

KFC Sales Forecast System is a full-stack service that generates hourly sales forecasts for restaurant stores. It combines a Go backend, a React frontend, and PostgreSQL to help teams plan production and reduce waste.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Go 1.21, Gin, Viper, robfig/cron |
| Frontend | React 18, TypeScript, Vite, Axios, Recharts, react-datepicker |
| Database | PostgreSQL 16 |
| Runtime | Docker, Docker Compose |

## What It Does

- Generates forecasts per store, product, hour, and day of week from historical sales averages.
- Schedules forecast generation automatically using a cron expression.
- Creates forecasts for the next 7 days on startup.
- Exposes a JSON API for stores, products, forecast dates, and forecast summaries.
- Provides a React UI with store selection, date selection, and forecast visualization.
- Persists the selected store and date in browser state between reloads.

## Quick Start

```bash
docker compose up --build
```

After startup:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- PostgreSQL: localhost:5432

The database is initialized from the SQL files in `backend/migrations`. Seed data includes stores, products, and historical sales records used for forecast generation.

## Run Separately (Without Docker Compose)

This is an alternative flow for running each service independently:

- PostgreSQL in a standalone Docker container
- Backend locally with `go run`
- Frontend locally with Vite

### 1) Run PostgreSQL

```bash
docker run -d \
  --name kfc-postgres \
  -e POSTGRES_DB=kfc_forecast \
  -e POSTGRES_USER=kfc_user \
  -e POSTGRES_PASSWORD=kfc_password \
  -p 5432:5432 \
  -v $(pwd)/backend/migrations:/docker-entrypoint-initdb.d \
  postgres:16-alpine
```

### 2) Run Backend Locally

```bash
cd backend
CONFIG_PATH=./config/config.yaml \
DB_HOST=localhost \
DB_PORT=5432 \
DB_NAME=kfc_forecast \
DB_USER=kfc_user \
DB_PASSWORD=kfc_password \
go run ./cmd/server
```

Backend API will be available at http://localhost:8080/api.

### 3) Run Frontend Locally

Use Node.js 20+ (recommended).

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000.

### 4) Verify

- Frontend: http://localhost:3000
- Backend health: http://localhost:8080/api/health

### 5) Stop Services

- Stop backend/frontend with `Ctrl+C` in their terminals.
- Stop PostgreSQL container:

```bash
docker stop kfc-postgres && docker rm kfc-postgres
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/stores | List all stores |
| GET | /api/products | List all products |
| GET | /api/forecasts?store_id=1&date=2024-01-15 | Get forecast summary for a store and date |
| GET | /api/forecasts/dates | List all available forecast dates |
| GET | /api/forecasts/dates?store_id=1 | List forecast dates for one store |
| POST | /api/forecasts/generate?date=2024-01-15 | Trigger forecast generation for a date |

## Configuration

Backend configuration lives in `backend/config/config.yaml`.

```yaml
server:
  port: 8080
  mode: release

database:
  host: postgres
  port: 5432
  name: kfc_forecast
  user: kfc_user
  password: kfc_password
  sslmode: disable

forecast:
  schedule: "0 0 * * *"
  history_weeks: 4
```

Environment variable overrides:

- `CONFIG_PATH`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `SERVER_PORT`

The Docker Compose setup already injects the database variables for the backend service.

## Development

Backend:

```bash
cd backend
go run ./cmd/server
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
├── backend/
│   ├── cmd/server/main.go
│   ├── config/config.yaml
│   ├── internal/
│   │   ├── config/
│   │   ├── database/
│   │   ├── forecast/
│   │   ├── handlers/
│   │   ├── models/
│   │   └── repository/
│   └── migrations/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── state/
│   │   ├── types/
│   │   └── utils/
│   └── vite.config.ts
└── docker-compose.yml
```
