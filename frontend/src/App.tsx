import React, { useMemo } from 'react';
import AppHeader from './components/AppHeader';
import EmptyState from './components/EmptyState';
import ForecastDatesCard from './components/ForecastDatesCard';
import ForecastView from './components/ForecastView';
import LoadingState from './components/LoadingState';
import StatusAlert from './components/StatusAlert';
import StoreListCard from './components/StoreListCard';
import { useForecastData } from './hooks/useForecastData';
import { usePreferences } from './state/ForecastPreferencesContext';
import './App.css';

function App() {
  const {
    state: { selectedStoreId: selectedStore, selectedDate },
    setSelectedStore,
    setSelectedDate,
  } = usePreferences();
  const {
    stores,
    availableDates,
    forecast,
    loading,
    error,
    generating,
    clearError,
    handleGenerateForecast,
  } = useForecastData({
    selectedStore,
    selectedDate,
    setSelectedStore,
    setSelectedDate,
  });

  const selectedStoreData = useMemo(
    () => stores.find((store) => store.id === selectedStore) ?? null,
    [selectedStore, stores],
  );

  return (
    <div className="app">
      <AppHeader generating={generating} onGenerateForecast={handleGenerateForecast} />

      <main className="main">
        <aside className="sidebar">
          <StoreListCard
            stores={stores}
            selectedStore={selectedStore}
            onSelectStore={setSelectedStore}
          />
          <ForecastDatesCard
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </aside>

        <section className="content">
          {error && <StatusAlert error={error} onClose={clearError} />}

          {selectedStore === null && (
            <EmptyState
              icon="🏪"
              title="Select a Store"
              description="Choose a store from the sidebar to view sales forecasts."
            />
          )}

          {selectedStore !== null && !selectedDate && !loading && (
            <EmptyState
              icon="📅"
              title="No Forecasts Available"
              description={`No forecast data is available yet for ${selectedStoreData?.name ?? 'this store'}.`}
            />
          )}

          {loading && <LoadingState />}

          {!loading && forecast && selectedDate && (
            <ForecastView forecast={forecast} selectedDate={selectedDate} />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
