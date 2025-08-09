import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setToken, clearTokens } from '../utils/storage';
import { refreshAccessToken } from './auth';

const API_BASE_URL = 'https://yapify-production.up.railway.app/api';

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired tokens automatically
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.warn(error.response?.data || 'No response data'); // Log the error response for debugging
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If request is unauthorized and we haven’t retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue requests while refresh is happening
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refresh = await getRefreshToken();
        if (!refresh) throw new Error('No refresh token available');

        const newTokens = await refreshAccessToken(refresh);
        await setToken(newTokens.access, refresh);

        processQueue(null, newTokens.access);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;
        }

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await clearTokens();
        // Optional: navigate to login here
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
