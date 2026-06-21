import axios from 'axios';
import { ForecastResponse, Store } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const getStores = async (): Promise<Store[]> => {
  const response = await api.get<Store[]>('/stores');
  return response.data;
};

export const getForecast = async (storeId: number, date: string): Promise<ForecastResponse> => {
  const response = await api.get<ForecastResponse>('/forecasts', {
    params: { store_id: storeId, date },
  });
  return response.data;
};

export const getForecastDates = async (storeId?: number): Promise<string[]> => {
  const params = storeId ? { store_id: storeId } : {};
  const response = await api.get<string[]>('/forecasts/dates', { params });
  return response.data;
};

export const triggerForecastGeneration = async (date?: string): Promise<void> => {
  const params = date ? { date } : {};
  await api.post('/forecasts/generate', null, { params });
};
