import axios from 'axios';
import { ScheduledEventsResponse, ScheduledEvent } from './types';

const API_KEY = import.meta.env.VITE_SPORTAPI_KEY;
const API_HOST = import.meta.env.VITE_SPORTAPI_HOST;

const apiClient = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': API_HOST,
  },
});

/**
 * Fetch scheduled football events for a given date, scoped to a category
 * (SofaScore has no "all sports" scheduled-events endpoint, only per-category)
 * @param date - Date string in YYYY-MM-DD format
 * @param categoryId - SofaScore category id (e.g. 1 = England)
 */
export const fetchScheduledEvents = async (
  date: string,
  categoryId: number
): Promise<ScheduledEvent[]> => {
  const response = await apiClient.get<ScheduledEventsResponse>(
    `/api/v1/category/${categoryId}/scheduled-events/${date}`
  );
  return response.data.events ?? [];
};

export const teamLogoUrl = (teamId: number): string =>
  `https://img.sofascore.com/api/v1/team/${teamId}/image/small`;
