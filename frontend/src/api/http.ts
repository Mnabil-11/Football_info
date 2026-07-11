import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Axios instance for our own backend API. The session JWT lives in an
 * httpOnly cookie set by the server (immune to XSS token theft), so all we
 * need is `withCredentials` — no token storage on the client.
 */
export const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

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
