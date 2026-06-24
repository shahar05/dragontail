# KFC Sales Forecast System - Technical Documentation

## Executive Summary

A full-stack production-ready web application for generating hourly sales forecasts for KFC restaurant stores. The system uses historical sales data to compute predictions on a per-store, per-product, per-hour basis, with automatic scheduling and a React-based dashboard for visualization and interaction.

---

## 1. System Architecture

### 1.1 High-Level Architecture

The system follows a **three-tier layered architecture**:

```
┌─────────────────────────────────────────┐
│     React Frontend (TypeScript/Vite)    │ ← User Interface Layer
├─────────────────────────────────────────┤
│  REST API (Gin Framework - Go)          │ ← API/Service Layer
├─────────────────────────────────────────┤
│  Business Logic Layer                   │
│  - Forecast Generation                  │
│  - Repository Pattern (Data Access)     │
├─────────────────────────────────────────┤
│  PostgreSQL Database                    │ ← Data Persistence Layer
└─────────────────────────────────────────┘
```

### 1.2 Component Breakdown

**Backend (Go):**
- **Entry Point**: `cmd/server/main.go` - Initializes server, DB, scheduler
- **Handlers**: REST API endpoints
- **Business Logic**: Forecast generation algorithm
- **Repository**: Database abstraction layer
- **Models**: Data structures
- **Config**: Environment & YAML configuration management
- **Database**: Connection pooling & migration management

**Frontend (React + TypeScript):**
- **Components**: Modular UI components (stores, dates, forecasts, alerts)
- **Hooks**: Data fetching & state synchronization (`useForecastData`)
- **Context API**: Global state management (`ForecastPreferencesContext`)
- **API Layer**: HTTP client for backend communication
- **Utils**: Formatting & helper functions

**Infrastructure:**
- **Docker Compose**: Orchestrates backend, frontend, and PostgreSQL
- **Nginx**: Reverse proxy for frontend
- **PostgreSQL**: Relational database with migration system

---

## 2. Technology Stack Justification

### Backend: Go + Gin

| Choice | Why Go | Why Gin |
|--------|---------|---------|
| **Performance** | Compiled language, minimal runtime overhead, perfect for concurrent I/O operations | Lightweight HTTP framework, fast routing |
| **Concurrency** | Goroutines are extremely efficient for handling multiple store/product forecasts in parallel | Gin handles concurrent requests natively |
| **Simplicity** | Static typing catches errors at compile time; minimal dependencies | Simple, opinionated routing with middleware support |
| **Deployment** | Single binary executable (no runtime required) | No dependency conflicts, easy Docker containerization |
| **Standard Library** | Powerful net/http, database/sql with context support | Works seamlessly with Go stdlib |

**Alternatives Considered:**
- **Node.js/Express**: Would work but Go's concurrency model is superior for this compute-intensive forecast generation
- **Python/FastAPI**: Good for ML, but forecast logic is deterministic averaging (not ML), unnecessary overhead
- **Java/Spring**: Overkill for this service's scope, slower startup time

### Frontend: React 18 + TypeScript + Vite

| Choice | Why This Stack |
|--------|-----------------|
| **React 18** | Component-based architecture, virtual DOM for efficient updates, large ecosystem |
| **TypeScript** | Catch type errors at compile time, better IDE support, self-documenting code |
| **Vite** | Lightning-fast dev server, optimized production builds, modern ESM-first approach |
| **Recharts** | Declarative chart library built for React, minimal configuration for time-series data |
| **React Context API** | Lightweight state management for preferences (no Redux/Zustand overhead for single store) |
| **Axios** | Simple HTTP client with request/response interceptors |

**Alternatives Considered:**
- **Vue.js**: Equally capable, but React ecosystem larger for date/chart libraries
- **Next.js**: Unnecessary SSR complexity; this is a dashboard, not an SEO-critical application
- **Redux**: Overkill for storing just store ID and date selection

### Database: PostgreSQL 16

| Feature | Why PostgreSQL |
|---------|-----------------|
| **ACID Compliance** | Ensures forecast data consistency; critical for financial planning |
| **JSON Support** | Future extensibility for complex forecast metadata |
| **Indexing** | Composite indexes on (store_id, product_id, forecast_date) for fast queries |
| **Constraint Uniqueness** | UNIQUE constraint prevents duplicate forecasts |
| **Connection Pooling** | Efficient resource management under load |

**Alternatives Considered:**
- **MongoDB**: Schemaless would add complexity; forecasts are inherently tabular
- **SQLite**: Not suitable for concurrent writes; limited to file-based single connection
- **MySQL**: PostgreSQL's JSON and constraint features are superior for this use case

### Scheduling: robfig/cron

- **Why Cron**: Battle-tested library, supports standard cron expressions (e.g., "0 0 * * *" for daily at midnight)
- **Why Not**: Task queues (Redis, RabbitMQ) would be overkill for a single scheduled job running once daily
- **Why Not**: Kubernetes CronJob would require container orchestration complexity

---

## 3. Design Patterns

### 3.1 Repository Pattern

**Location**: `internal/repository/repository.go`

```go
type Repository struct {
    db *sql.DB
}

func New(db *sql.DB) *Repository {
    return &Repository{db: db}
}

func (r *Repository) GetForecastsByStoreAndDate(storeID int, date time.Time) ([]models.Forecast, error) {
    // SQL query execution
}
```

**Benefits:**
- Decouples business logic from database implementation
- Easy to mock for unit testing
- Single responsibility: data access only

**Implementation**: All SQL queries are centralized in the repository, making the forecast generator agnostic to database details.

### 3.2 Dependency Injection

**Location**: `cmd/server/main.go`

```go
repo := repository.New(db)
gen := forecast.NewGenerator(repo, cfg.Forecast.HistoryWeeks)
h := handlers.New(repo, gen)
```

**Benefits:**
- Loose coupling between components
- Easy testing (swap real repo with mock)
- Clear dependency graph at startup

### 3.3 Middleware Pattern

**Location**: `cmd/server/main.go`

```go
r.Use(cors.New(cors.Config{...}))
```

**Implementation**: CORS middleware enables cross-origin requests for the frontend.

### 3.4 Context API State Management

**Location**: `frontend/src/state/ForecastPreferencesContext.tsx`

```typescript
type PreferencesAction
  | { type: 'setStore'; payload: number | null }
  | { type: 'setDate'; payload: string };
```

**Benefits:**
- Unidirectional data flow (reducer pattern)
- Persistent state in localStorage
- Avoids prop drilling

**Implementation**: Uses `useReducer` for predictable state transitions.

### 3.5 Custom Hooks for Business Logic

**Location**: `frontend/src/hooks/useForecastData.ts`

```typescript
export function useForecastData({
  selectedStore,
  selectedDate,
  ...
}: UseForecastDataParams): UseForecastDataResult
```

**Benefits:**
- Encapsulates API calls, loading, error states
- Reusable across components
- Separates data concerns from UI rendering

### 3.6 Adapter Pattern (Configuration)

**Location**: `internal/config/config.go`

```go
func (d DatabaseConfig) DSN() string {
    // Converts config struct to PostgreSQL DSN
}
```

**Benefits:**
- Abstracts environment variable binding (Viper)
- Supports both YAML and environment variable overrides

### 3.7 Null Object Pattern

**Location**: `frontend/src/hooks/useForecastData.ts`

```typescript
if (stores === null && stores.length > 0) {
    setSelectedStore(stores[0].id);
}
```

**Implementation**: Empty state handling prevents null reference errors.

### 3.8 Factory Pattern

**Location**: Multiple files

```go
func New(db *sql.DB) *Repository { ... }
func NewGenerator(repo *repository.Repository, historyWeeks int) *Generator { ... }
func New(repo *repository.Repository, gen *forecast.Generator) *Handler { ... }
```

**Benefits**: Centralized object creation, consistent initialization logic.

---

## 4. Data Models & Database Design

### 4.1 Entity-Relationship Model

```
Stores (1) ──→ (Many) SalesHistory
  ├─ id (PK)          ├─ store_id (FK)
  ├─ name             ├─ product_id (FK)
  ├─ location         ├─ sale_date
  └─ created_at       ├─ sale_hour
                      ├─ quantity
                      └─ created_at

Products (1) ──→ (Many) SalesHistory
  ├─ id (PK)
  ├─ name       
  ├─ category   
  └─ created_at 

Stores (1) ──→ (Many) Forecasts
Products (1) ──→ (Many) Forecasts
  ├─ id (PK)
  ├─ store_id (FK)
  ├─ product_id (FK)
  ├─ forecast_date
  ├─ hour
  ├─ predicted_quantity
  ├─ generated_at
  └─ UNIQUE(store_id, product_id, forecast_date, hour)
```

### 4.2 Indexing Strategy

```sql
-- Composite index for fast forecast retrieval by store and date
CREATE INDEX idx_forecasts_store_date ON forecasts(store_id, forecast_date);

-- Composite index for historical data aggregation
CREATE INDEX idx_sales_history_store_product ON sales_history(store_id, product_id);

-- Date-based filtering for time-range queries
CREATE INDEX idx_sales_history_date ON sales_history(sale_date);
```

**Query Performance**:
- Forecast lookup: O(1) with index on (store_id, forecast_date)
- Historical average computation: O(log n) with composite index

### 4.3 Constraints for Data Integrity

```sql
-- Hour validation: ensures only 0-23 are stored
CHECK (hour >= 0 AND hour <= 23)
CHECK (sale_hour >= 0 AND sale_hour <= 23)

-- Quantity validation: prevents negative sales
CHECK (quantity >= 0)

-- Uniqueness: prevents duplicate forecasts
UNIQUE(store_id, product_id, forecast_date, hour)

-- Referential integrity: cascading deletes if store/product deleted
FOREIGN KEY (store_id) REFERENCES stores(id)
FOREIGN KEY (product_id) REFERENCES products(id)
```

---

## 5. Forecast Generation Algorithm

### 5.1 Algorithm Overview

**Location**: `internal/forecast/generator.go`

```
For each date in forecast period:
  For each store:
    For each product:
      For each hour (0-23):
        1. Identify the day of week for forecast date
        2. Query historical sales for:
           - Same store, product, hour, day of week
           - Last N weeks (default: 4 weeks)
        3. Compute average quantity: sum(quantities) / count
        4. Store forecast record in database
```

### 5.2 Historical Average Computation

**Location**: `internal/repository/repository.go` - `GetHistoricalAverages()`

```go
SELECT AVG(quantity)
FROM sales_history
WHERE store_id = $1 
  AND product_id = $2
  AND EXTRACT(DOW FROM sale_date) = $3  -- Day of week match
  AND EXTRACT(HOUR FROM sale_time) = $4 -- Hour match
  AND sale_date >= NOW() - INTERVAL '28 days'
```

**Why This Approach:**
- **Day-of-week significance**: Sales patterns differ (weekends vs. weekdays)
- **Hourly granularity**: Demand varies by time of day (breakfast vs. dinner)
- **Rolling window (4 weeks)**: Balances recency with sample size
- **Simple average**: Sufficient for inventory planning; robust to outliers

**Alternatives Considered:**
- **Weighted average**: Could prioritize recent weeks, adds complexity
- **Moving average**: Better for trend detection, unnecessary for static patterns
- **Machine learning**: Overkill for deterministic patterns; hard to explain to non-technical stakeholders

### 5.3 Scheduling Implementation

**Location**: `internal/forecast/generator.go` - `Start()` method

```go
func (g *Generator) Start(schedule string) error {
    g.scheduler = cron.New()
    _, err := g.scheduler.AddFunc(schedule, func() {
        g.GenerateForDate(time.Now().AddDate(0, 0, 1))
    })
    g.scheduler.Start()
}
```

**Configuration** (from `config.yaml`):
```yaml
forecast:
  schedule: "0 0 * * *"         # Daily at midnight UTC
  history_weeks: 4              # Look back 28 days
```

**Execution**:
- Scheduled job triggers once daily
- Generates forecasts for the next calendar day
- Runs in background; doesn't block API requests
- Graceful shutdown waits for in-flight jobs to complete

---

## 6. API Design

### 6.1 RESTful Endpoints

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/api/health` | Service health check | - |
| GET | `/api/stores` | List all stores | - |
| GET | `/api/products` | List all products | - |
| GET | `/api/forecasts` | Get forecast for store/date | `store_id`, `date` |
| GET | `/api/forecasts/dates` | Available forecast dates for store | `store_id` |
| POST | `/api/forecasts/generate` | Trigger forecast generation | - |

### 6.2 Response Format Example

```json
GET /api/forecasts?store_id=1&date=2024-06-25

{
  "store_id": 1,
  "store_name": "Downtown KFC",
  "forecast_date": "2024-06-25",
  "products": [
    {
      "product_id": 1,
      "product_name": "Original Recipe Chicken",
      "category": "Chicken",
      "hourly_data": [
        { "hour": 10, "predicted_quantity": 45.2 },
        { "hour": 11, "predicted_quantity": 62.8 },
        ...
        { "hour": 22, "predicted_quantity": 12.1 }
      ]
    },
    ...
  ]
}
```

### 6.3 Error Handling

```go
if storeIDStr == "" || dateStr == "" {
    c.JSON(http.StatusBadRequest, gin.H{"error": "store_id and date are required"})
    return
}

if err != nil {
    status := http.StatusInternalServerError
    if strings.Contains(err.Error(), "not found") {
        status = http.StatusNotFound
    }
    c.JSON(status, gin.H{"error": err.Error()})
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid parameters
- `404 Not Found`: Forecast/store/product doesn't exist
- `500 Internal Server Error`: Database or computation failure

### 6.4 CORS Configuration

```go
r.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"*"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: false,
}))
```

**Rationale**: Allows frontend (port 3000) to communicate with backend (port 8080) during development.

---

## 7. Frontend Architecture

### 7.1 Component Hierarchy

```
App
├── AppHeader
│   └── Trigger Forecast Generation Button
├── Sidebar (Main)
│   ├── StoreListCard
│   │   └── Store Selection List
│   └── ForecastDatesCard
│       └── Date Picker
└── Content (Main)
    ├── StatusAlert (conditional)
    ├── LoadingState (conditional)
    ├── EmptyState (conditional)
    └── ForecastView
        └── Recharts LineChart (hourly predictions)
```

### 7.2 State Management Flow

```typescript
┌──────────────────────────────────────────┐
│ ForecastPreferencesContext (Global)      │
│ ├─ selectedStoreId (localStorage)        │
│ └─ selectedDate (localStorage)           │
└──────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ useForecastData (Custom Hook)            │
│ ├─ Fetches stores                        │
│ ├─ Fetches available dates for store     │
│ ├─ Fetches forecast for store/date       │
│ ├─ Manages loading/error states          │
│ └─ Handles manual forecast generation    │
└──────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────┐
│ Components (Presentational)              │
│ ├─ StoreListCard                         │
│ ├─ ForecastDatesCard                     │
│ ├─ ForecastView                          │
│ └─ StatusAlert/LoadingState/EmptyState   │
└──────────────────────────────────────────┘
```

### 7.3 Data Fetching Strategy

**Location**: `src/hooks/useForecastData.ts`

```typescript
// 1. On mount: Fetch stores
useEffect(() => {
  getStores().then(setStores).catch(...);
}, []);

// 2. When store changes: Fetch available dates
useEffect(() => {
  if (selectedStore !== null) {
    getForecastDates(selectedStore).then(...);
  }
}, [selectedStore]);

// 3. When store/date changes: Fetch forecast
useEffect(() => {
  loadForecast();
}, [selectedStore, selectedDate]);
```

**Benefits:**
- Cascading data fetching prevents unnecessary API calls
- Dependencies are explicit (fewer race conditions)
- Error states are isolated per effect

### 7.4 Persistent State

**Location**: `src/state/ForecastPreferencesContext.tsx`

```typescript
function loadPreferences(): PreferencesState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialState;
  
  const parsed = JSON.parse(saved);
  return {
    selectedStoreId: parsed.selectedStoreId ?? null,
    selectedDate: parsed.selectedDate ?? '',
  };
}
```

**Implementation**:
- Saves to `localStorage` on every state change
- Restores on component mount
- User's last selection persists across browser reloads

---

## 8. Database Connection Management

### 8.1 Connection Pooling

**Location**: `internal/database/database.go`

```go
db.SetMaxOpenConns(25)     // Maximum concurrent connections
db.SetMaxIdleConns(25)     // Keep 25 idle connections ready
db.SetConnMaxLifetime(5 * time.Minute) // Recycle connections
```

**Rationale:**
- **Max 25 open**: Balances parallelism with resource usage
- **Max 25 idle**: Reduces latency by reusing connections
- **5-min lifetime**: Prevents stale/broken connections

### 8.2 Retry Logic

```go
for i := 0; i < 10; i++ {
    if err = db.Ping(); err == nil {
        break
    }
    fmt.Printf("Waiting for database... attempt %d/10\n", i+1)
    time.Sleep(3 * time.Second)
}
```

**Purpose**: Gracefully handles PostgreSQL startup delays in Docker Compose.

### 8.3 DSN Construction

```go
func (d DatabaseConfig) DSN() string {
    return "host=" + d.Host +
        " port=" + strconv.Itoa(d.Port) +
        " dbname=" + d.Name +
        " user=" + d.User +
        " password=" + d.Password +
        " sslmode=" + d.SSLMode
}
```

**Format**: PostgreSQL connection string (libpq format).

---

## 9. Configuration Management

### 9.1 Dual Configuration Sources

**Location**: `internal/config/config.go`

```go
viper.SetConfigFile(configPath)      // YAML file
viper.AutomaticEnv()                 // Environment variables (priority)
_ = viper.BindEnv("database.host", "DB_HOST")
```

**Priority**: Environment variables override YAML.

**Configuration File** (`config/config.yaml`):
```yaml
server:
  port: 8080
  mode: debug              # "debug" or "release"

database:
  host: postgres
  port: 5432
  name: kfc_forecast
  user: postgres
  password: postgres
  sslmode: disable

forecast:
  schedule: "0 0 * * *"    # Daily at midnight
  history_weeks: 4         # Look back 28 days
```

**Benefits:**
- Flexible deployment (Docker: use env vars; local: use YAML)
- Secrets not in source control
- Easy config changes without recompilation

---

## 10. Deployment & Docker

### 10.1 Docker Compose Architecture

**Location**: `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: kfc_forecast
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./backend/migrations:/migrations
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      SERVER_PORT: 8080

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

### 10.2 Multi-Stage Builds

**Backend Dockerfile**:
```dockerfile
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN go build -o server ./cmd/server

FROM alpine:latest
COPY --from=builder /app/server /app/server
CMD ["/app/server"]
```

**Benefits:**
- Only runtime binary in final image (small size)
- Build dependencies not included
- Faster deployment

**Frontend Dockerfile**:
```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

---

## 11. Error Handling & Logging

### 11.1 Backend Logging

**Location**: Throughout codebase

```go
log.Fatalf("Failed to load config: %v", err)  // Fatal error
log.Printf("Warning: initial forecast generation failed: %v", err) // Non-blocking warning
log.Printf("Server starting on %s", addr)     // Info log
```

**Levels Used**:
- `Fatal`: Application cannot start
- `Printf`: Warnings, errors, info
- `Deferred logs`: Success state on shutdown

### 11.2 Frontend Error Handling

```typescript
.catch(() => setError('Failed to load stores'))
.catch(() => setError('Failed to load forecast dates'))
```

**UX Considerations**:
- Error message displayed in StatusAlert component
- User can dismiss and retry
- No "hard failures" that block the app

### 11.3 Graceful Degradation

```go
if err := gen.GenerateInitial(); err != nil {
    log.Printf("Warning: initial forecast generation failed: %v", err)
    // Server still starts; forecasts can be generated later
}
```

---

## 12. Key Design Decisions & Trade-offs

### Decision 1: Simple Average vs. ML Model

**Choice**: Simple average of historical data

**Rationale**:
- ✅ Explainable (business stakeholders understand)
- ✅ No training/retraining overhead
- ✅ Deterministic results
- ❌ Doesn't capture trends or seasonality

**When ML Would Be Better**: If data showed complex patterns, seasonality across months, or external factors (holidays, promotions).

---

### Decision 2: Polling vs. Real-time Updates

**Choice**: Polling (frontend fetches on demand)

**Rationale**:
- ✅ Simple; no WebSocket infrastructure
- ✅ Fits REST API paradigm
- ✅ Easy to test
- ❌ Slightly higher latency for live updates

**When WebSockets Would Be Better**: If multiple users need real-time forecast updates or manual triggers from other sources.

---

### Decision 3: React Context vs. Redux

**Choice**: React Context API with useReducer

**Rationale**:
- ✅ Minimal state (store ID + date)
- ✅ No external dependency
- ✅ Sufficient for persistence
- ❌ Would scale poorly if app had 50+ interconnected state slices

**When Redux/Zustand Would Be Better**: Complex app with deeply nested state or time-travel debugging needs.

---

### Decision 4: SQL Joins vs. Multiple Queries

**Choice**: Single query with JOINs in handlers

```go
// Repository returns raw forecasts; handler joins with product/store names
```

**Rationale**:
- ✅ Reduces round-trips
- ✅ Single query is atomic
- ✅ Database optimizes joins
- ❌ Handler knows schema details

**Tradeoff**: Acceptable for this API surface; would reconsider if hundreds of endpoints.

---

## 13. Scalability Considerations

### 13.1 Current Bottlenecks

1. **Forecast Generation**: O(stores × products × 24 hours)
   - Example: 100 stores × 50 products = 120k forecasts/day
   - Current solution: Runs nightly, completes in seconds

2. **Database Queries**: Historical average queries on 4 weeks of data
   - Mitigation: Indexes on (store_id, product_id, sale_date)

3. **Frontend Rendering**: Recharts with 24 hourly data points
   - Mitigation: Data points are minimal; no virtualization needed

### 13.2 Future Scaling Strategies

| Bottleneck | Current | Scale-Up Strategy |
|------------|---------|-------------------|
| Forecast Generation | Nightly cron | Parallel goroutines; batch processing |
| Historical Data Volume | 4-week window | Materialized views; partitioned tables |
| API Throughput | Single Go process | Horizontal scaling with load balancer |
| Database Connections | Max 25 | Connection pooling service (PgBouncer) |
| Frontend State Sync | localStorage | Redis cache for user preferences |

### 13.3 Performance Optimizations Done

1. **Database Indexes**: Composite indexes on query hot paths
2. **Connection Pooling**: Max idle/open connections configured
3. **Goroutines**: Forecast generation parallelizable by default
4. **React Memoization**: `useMemo` prevents unnecessary re-renders
5. **API Response Format**: Only data needed (no over-fetching)

---

## 14. Security Considerations

### 14.1 Current Implementation

**Input Validation**:
```go
if storeIDStr == "" || dateStr == "" {
    c.JSON(http.StatusBadRequest, gin.H{"error": "..."})
}
```

**CORS Policy**:
```go
AllowOrigins: []string{"*"} // Permissive for dev
```

**Database**:
- Parameterized queries (prevents SQL injection)
- No raw string concatenation

### 14.2 Production Hardening Needed

| Risk | Current | Production Fix |
|------|---------|----------------|
| CORS | `*` (all origins) | Whitelist specific origin |
| Auth | None | JWT tokens or API keys |
| HTTPS | Not enforced | SSL/TLS termination |
| SQL Injection | Parameterized queries ✓ | ✓ Already safe |
| Rate Limiting | None | Implement middleware |
| Environment Secrets | YAML file | Use secrets manager (AWS Secrets, Vault) |

### 14.3 Recommended Security Enhancements

```go
// Add middleware for rate limiting
r.Use(ratelimit.Max(100)) // 100 requests/minute

// Add authentication
r.Use(auth.BearerToken())

// Restrict CORS
r.Use(cors.New(cors.Config{
    AllowOrigins: []string{"https://forecast.kfc.com"},
}))
```

---

## 15. Testing Strategy

### 15.1 Test Coverage Opportunities

**Unit Tests** (should be added):
- `repository.GetHistoricalAverages()` - Mock DB, verify query logic
- `forecast.GenerateForDate()` - Mock repo, verify algorithm
- `handlers.GetForecast()` - Mock handler, verify response format

**Integration Tests**:
- Full flow: Insert sales history → Generate forecast → Query forecast
- Database migrations work correctly
- API endpoints return correct status codes

**Example**:
```go
func TestGetHistoricalAverages(t *testing.T) {
    repo := NewMockRepository()
    repo.SetHistoricalData(...)
    
    avg, err := repo.GetHistoricalAverages(1, 1, 1, 10, 4)
    assert.NoError(t, err)
    assert.Equal(t, 50.5, avg)
}
```

### 15.2 Frontend Testing

**Component Tests** (React Testing Library):
```typescript
test('StoreListCard displays stores', () => {
  render(<StoreListCard stores={mockStores} ... />);
  expect(screen.getByText('Downtown KFC')).toBeInTheDocument();
});
```

**Hook Tests** (React Hooks Testing Library):
```typescript
test('useForecastData fetches stores on mount', async () => {
  const { result } = renderHook(() => useForecastData(...));
  await waitFor(() => {
    expect(result.current.stores.length).toBeGreaterThan(0);
  });
});
```

---

## 16. Summary Table: Architecture Decisions

| Component | Technology | Why | Alternative |
|-----------|-----------|-----|-------------|
| Backend Language | Go | Performance, concurrency, single binary | Node.js, Python, Java |
| Web Framework | Gin | Lightweight, fast routing | Echo, Chi, Standard lib |
| Frontend | React + TypeScript | Component-based, type-safe, ecosystem | Vue, Angular, Svelte |
| Build Tool | Vite | Fast HMR, optimized builds | Webpack, Rollup |
| Database | PostgreSQL | ACID, JSON support, reliability | MongoDB, SQLite, MySQL |
| State Management | Context API | Minimal for this scope | Redux, Zustand, Recoil |
| Scheduling | robfig/cron | Standard library, simple | APScheduler, Celery, K8s CronJob |
| Deployment | Docker Compose | Local dev & testing | Kubernetes, Terraform, CloudFormation |

---

## 17. Conclusion

The KFC Sales Forecast System is built with production-ready patterns:

✅ **Separation of Concerns**: Clear layering (handlers → business logic → repository → DB)
✅ **Testability**: Dependency injection enables mocking
✅ **Scalability**: Connection pooling, indexes, parallelizable forecast generation
✅ **Maintainability**: Standard design patterns (factory, repository, context)
✅ **Developer Experience**: TypeScript type safety, Vite fast refresh, Docker Compose simplicity

The technology stack balances pragmatism with best practices—using boring, proven tools rather than chasing trends.

---

## Appendix: Directory Structure

```
.
├── backend/
│   ├── cmd/server/main.go           # Entry point
│   ├── internal/
│   │   ├── config/                  # Configuration management
│   │   ├── database/                # DB connection
│   │   ├── forecast/                # Forecast algorithm + scheduler
│   │   ├── handlers/                # REST endpoints
│   │   ├── models/                  # Data structures
│   │   └── repository/              # Data access layer
│   ├── migrations/                  # SQL migration files
│   ├── Dockerfile                   # Multi-stage build
│   └── go.mod                       # Go dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # HTTP client
│   │   ├── components/              # UI components
│   │   ├── hooks/                   # Custom hooks (data fetching)
│   │   ├── state/                   # Context, state management
│   │   ├── types/                   # TypeScript interfaces
│   │   ├── utils/                   # Helpers (format, etc.)
│   │   ├── App.tsx                  # Root component
│   │   └── main.tsx                 # Entry point
│   ├── Dockerfile                   # Multi-stage build
│   ├── package.json                 # npm dependencies
│   ├── vite.config.ts               # Vite configuration
│   └── tsconfig.json                # TypeScript config
│
├── docker-compose.yml               # Orchestration
├── README.md                        # User-facing docs
└── TECHNICAL_DOCUMENTATION.md       # This file
```

---

*Document generated for technical interview discussion.*
