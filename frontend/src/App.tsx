import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getForecast, getForecastDates, getStores, triggerForecastGeneration } from './api';
import { ForecastResponse, Store } from './types';
import './App.css';

const STORAGE_KEY = 'kfc_forecast_preferences';

interface Preferences {
  selectedStoreId: number | null;
  selectedDate: string;
}

function formatHour(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const normalized = hour % 12 || 12;
  return `${normalized}:00 ${period}`;
}

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const prefs: Preferences = JSON.parse(saved);
      if (prefs.selectedStoreId) {
        setSelectedStore(prefs.selectedStoreId);
      }
      if (prefs.selectedDate) {
        setSelectedDate(prefs.selectedDate);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const prefs: Preferences = { selectedStoreId: selectedStore, selectedDate };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [selectedStore, selectedDate]);

  useEffect(() => {
    getStores()
      .then((data) => {
        setStores(data);
        if (!selectedStore && data.length > 0) {
          setSelectedStore(data[0].id);
        }
      })
      .catch(() => setError('Failed to load stores'));
  }, []);

  useEffect(() => {
    if (selectedStore === null) {
      setAvailableDates([]);
      setForecast(null);
      return;
    }

    getForecastDates(selectedStore)
      .then((dates) => {
        setAvailableDates(dates);
        if (dates.length > 0 && !dates.includes(selectedDate)) {
          setSelectedDate(dates[0]);
        }
        if (dates.length === 0) {
          setSelectedDate('');
          setForecast(null);
        }
      })
      .catch(() => setError('Failed to load forecast dates'));
  }, [selectedStore]);

  const loadForecast = useCallback(() => {
    if (!selectedStore || !selectedDate) {
      return;
    }

    setLoading(true);
    setError(null);

    getForecast(selectedStore, selectedDate)
      .then((data) => setForecast(data))
      .catch(() => {
        setForecast(null);
        setError('Failed to load forecast data');
      })
      .finally(() => setLoading(false));
  }, [selectedStore, selectedDate]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const handleGenerateForecast = async () => {
    setGenerating(true);
    setError(null);

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await triggerForecastGeneration(dateStr);

      if (selectedStore) {
        const dates = await getForecastDates(selectedStore);
        setAvailableDates(dates);
        if (dates.includes(dateStr)) {
          setSelectedDate(dateStr);
        }
      }
    } catch {
      setError('Failed to trigger forecast generation');
    } finally {
      setGenerating(false);
    }
  };

  const selectedStoreData = useMemo(
    () => stores.find((store) => store.id === selectedStore) ?? null,
    [selectedStore, stores],
  );

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <span className="header-logo">🍗</span>
            <div>
              <h1>KFC Sales Forecast</h1>
              <p>Daily store and product sales predictions</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleGenerateForecast} disabled={generating}>
            {generating ? '⏳ Generating...' : "🔄 Generate Tomorrow's Forecast"}
          </button>
        </div>
      </header>

      <main className="main">
        <aside className="sidebar">
          <div className="card">
            <h2>📍 Stores</h2>
            <div className="store-list">
              {stores.map((store) => (
                <button
                  key={store.id}
                  className={`store-item ${selectedStore === store.id ? 'active' : ''}`}
                  onClick={() => setSelectedStore(store.id)}
                >
                  <span className="store-name">{store.name}</span>
                  <span className="store-location">{store.location}</span>
                </button>
              ))}
            </div>
          </div>

          {availableDates.length > 0 && (
            <div className="card">
              <h2>📅 Forecast Dates</h2>
              <div className="date-list">
                {availableDates.map((date) => (
                  <button
                    key={date}
                    className={`date-item ${selectedDate === date ? 'active' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="content">
          {error && (
            <div className="alert alert-error">
              <span>⚠️ {error}</span>
              <button type="button" onClick={() => setError(null)}>
                ✕
              </button>
            </div>
          )}

          {!selectedStore && (
            <div className="empty-state">
              <span className="empty-icon">🏪</span>
              <h3>Select a Store</h3>
              <p>Choose a store from the sidebar to view sales forecasts.</p>
            </div>
          )}

          {selectedStore && !selectedDate && !loading && (
            <div className="empty-state">
              <span className="empty-icon">📅</span>
              <h3>No Forecasts Available</h3>
              <p>No forecast data is available yet for {selectedStoreData?.name ?? 'this store'}.</p>
            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading forecast data...</p>
            </div>
          )}

          {!loading && forecast && selectedDate && (
            <div className="forecast-view">
              <div className="forecast-header">
                <div>
                  <h2>{forecast.store_name}</h2>
                  <p className="forecast-date">
                    📅{' '}
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="forecast-stats">
                  <div className="stat">
                    <span className="stat-value">{forecast.products?.length || 0}</span>
                    <span className="stat-label">Products</span>
                  </div>
                </div>
              </div>

              {forecast.products.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <h3>No Forecast Data</h3>
                  <p>No product forecasts are available for this date yet.</p>
                </div>
              ) : (
                <div className="products-grid">
                  {forecast.products.map((product) => {
                    const totalPredicted = product.hourly_data.reduce(
                      (sum, point) => sum + point.predicted_quantity,
                      0,
                    );
                    const peakHour = product.hourly_data.reduce(
                      (max, point) =>
                        point.predicted_quantity > max.predicted_quantity ? point : max,
                      product.hourly_data[0] || { hour: 0, predicted_quantity: 0 },
                    );
                    const maxQuantity = Math.max(
                      ...product.hourly_data.map((point) => point.predicted_quantity),
                      1,
                    );

                    return (
                      <div key={product.product_id} className="product-card">
                        <div className="product-header">
                          <div>
                            <h3>{product.product_name}</h3>
                            <span className="category-badge">{product.category}</span>
                          </div>
                          <div className="product-stats">
                            <div className="stat-small">
                              <span className="stat-small-value">{Math.round(totalPredicted)}</span>
                              <span className="stat-small-label">Total</span>
                            </div>
                            <div className="stat-small">
                              <span className="stat-small-value">{formatHour(peakHour.hour)}</span>
                              <span className="stat-small-label">Peak</span>
                            </div>
                          </div>
                        </div>

                        <div className="hourly-chart">
                          {product.hourly_data.map((point) => {
                            const height = Math.round((point.predicted_quantity / maxQuantity) * 100);
                            return (
                              <div
                                key={point.hour}
                                className="bar-wrapper"
                                title={`${formatHour(point.hour)}: ${Math.round(point.predicted_quantity)} units`}
                              >
                                <div className="bar" style={{ height: `${height}%` }}></div>
                                <span className="bar-label">{point.hour}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
