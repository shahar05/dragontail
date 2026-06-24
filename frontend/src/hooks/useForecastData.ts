import { useCallback, useEffect, useState } from 'react';
import { getForecast, getForecastDates, getStores, triggerForecastGeneration } from '../api';
import { ForecastResponse, Store } from '../types';

interface UseForecastDataParams {
  selectedStore: number | null;
  selectedDate: string;
  setSelectedStore: (storeId: number | null) => void;
  setSelectedDate: (date: string) => void;
}

interface UseForecastDataResult {
  stores: Store[];
  availableDates: string[];
  forecast: ForecastResponse | null;
  loading: boolean;
  error: string | null;
  generating: boolean;
  clearError: () => void;
  handleGenerateForecast: () => Promise<void>;
}

export function useForecastData({
  selectedStore,
  selectedDate,
  setSelectedStore,
  setSelectedDate,
}: UseForecastDataParams): UseForecastDataResult {
  const [stores, setStores] = useState<Store[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getStores()
      .then((data) => {
        setStores(data);
      })
      .catch(() => setError('Failed to load stores'));
  }, []);

  useEffect(() => {
    if (selectedStore === null && stores.length > 0) {
      setSelectedStore(stores[0].id);
    }
  }, [selectedStore, setSelectedStore, stores]);

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
  }, [selectedDate, selectedStore, setSelectedDate]);

  const loadForecast = useCallback(() => {
    if (selectedStore === null || !selectedDate) {
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

  const handleGenerateForecast = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await triggerForecastGeneration(dateStr);

      if (selectedStore !== null) {
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
  }, [selectedStore, setSelectedDate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    stores,
    availableDates,
    forecast,
    loading,
    error,
    generating,
    clearError,
    handleGenerateForecast,
  };
}
