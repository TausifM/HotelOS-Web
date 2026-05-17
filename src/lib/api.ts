import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      refreshing = true;
      const { refreshToken, updateToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const newToken = data.data.accessToken;
        updateToken(newToken);
        queue.forEach((q) => q.resolve(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        queue.forEach((q) => q.reject(error));
        queue = [];
        logout();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }

    const msg = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status !== 401 && error.response?.status !== 404) {
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);
export const reportsApi = {
  dashboard: (params?: Record<string, any>) =>
    api.get("/api/reports/dashboard", { params }),
  dailyBusiness: (date?: string) =>
    api.get("/api/reports/daily-business", { params: { date } }),
  occupancy: (startDate: string, endDate: string) =>
    api.get("/api/reports/occupancy", { params: { startDate, endDate } }),
  revenue: (startDate?: string, endDate?: string) =>
    api.get("/api/reports/revenue", { params: { startDate, endDate } }),
  policeVerification: (startDate?: string, endDate?: string, format?: string) =>
    api.get("/api/reports/police-verification", { params: { startDate, endDate, format } }),
  guests: () => api.get("/api/reports/guests"),
};

export default api;
