import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRefresh?: boolean;
};

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 100000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshing = false;
let queue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

const flushQueue = (error?: unknown) => {
  queue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });
  queue = [];
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (!original) {
      return Promise.reject(error);
    }

    const url = original.url || '';
    const isAuthRoute =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/logout');

    if (
      status === 401 &&
      !original._retry &&
      !original._skipAuthRefresh &&
      !isAuthRoute
    ) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: () => resolve(api(original)),
            reject,
          });
        });
      }

      original._retry = true;
      refreshing = true;

      try {
        await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
            timeout: 30000,
          }
        );

        flushQueue();
        return api(original);
      } catch (refreshError) {
        flushQueue(refreshError);
        useAuthStore.getState().clearSession();

        if (typeof window !== 'undefined') {
          const next = `${window.location.pathname}${window.location.search}`;
          if (!window.location.pathname.startsWith('/auth/login')) {
            window.location.href = `/auth/login?next=${encodeURIComponent(next)}`;
          }
        }

        return Promise.reject(refreshError);
      } finally {
        refreshing = false;
      }
    }

    const msg = error.response?.data?.message || 'Something went wrong';

    if (status !== 401 && status !== 404) {
      toast.error(msg);
    }

    return Promise.reject(error);
  }
);

export const reportsApi = {
  dashboard: (params?: Record<string, any>) =>
    api.get('/api/reports/dashboard', { params }),
  dailyBusiness: (date?: string) =>
    api.get('/api/reports/daily-business', { params: { date } }),
  occupancy: (startDate: string, endDate: string) =>
    api.get('/api/reports/occupancy', { params: { startDate, endDate } }),
  revenue: (startDate?: string, endDate?: string) =>
    api.get('/api/reports/revenue', { params: { startDate, endDate } }),
  policeVerification: (startDate?: string, endDate?: string, format?: string) =>
    api.get('/api/reports/police-verification', {
      params: { startDate, endDate, format },
    }),
  guests: () => api.get('/api/reports/guests'),
};

export default api;