// api/client.ts
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setToken, clearTokens } from '@/utils/storage';
import { refreshAccessToken } from '@/api/auth';

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

// Placeholder logout handler — to be set from outside
let onLogoutHandler: (() => void) | null = null;

export function setOnLogoutHandler(handler: () => void) {
  onLogoutHandler = handler;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.warn(error.response?.data || 'No response data');
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
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

        // Call logout handler to update auth state / navigate user
        if (onLogoutHandler) {
          onLogoutHandler();
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
