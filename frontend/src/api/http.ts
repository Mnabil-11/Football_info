import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = 'ft_token';

/** Axios instance for our own backend API. */
export const http = axios.create({
  baseURL: BASE_URL,
});

// Attach the JWT (when present) to every request.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

/** Shape of the backend's JSON error body. */
interface BackendErrorBody {
  message?: string;
}

/** Extract a human-readable message from an axios error against our backend. */
export const getBackendErrorMessage = (
  err: unknown,
  fallback = 'حدث خطأ في الخادم'
): string => {
  if (err instanceof AxiosError) {
    const body = err.response?.data as BackendErrorBody | undefined;
    return body?.message ?? fallback;
  }
  return fallback;
};
