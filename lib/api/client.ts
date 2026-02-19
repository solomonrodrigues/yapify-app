// api/client.ts
import { clearTokens, getAccess, getRefresh, setTokens } from '@/lib/utils/storage';
import { TokenRefresh } from '@/types/api';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_BASE_URL = 'https://yapify.net/api';

// Default logout handler with warning
let onLogoutHandler: () => void = () => {
  console.warn('Logout triggered but no handler set. Call setOnLogoutHandler() to handle logout properly.');
};

export function setOnLogoutHandler(handler: () => void) {
  onLogoutHandler = handler;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// a separate, interceptor-free client for auth endpoints
const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Refresh call (no interceptors)
export const refreshAuthTokens = async (
  refresh: string
): Promise<TokenRefresh> => {
  const res = await authClient.post<TokenRefresh>('/auth/refresh/', { refresh });
  return res.data;
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//  Refresh Lock + Queue System
let isRefreshing = false;
let refreshPromise: Promise<TokenRefresh> | null = null;
type QueueEntry = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};
let requestQueue: QueueEntry[] = [];

// Add request to waiting queue
function queueRequest(resolve: (token: string) => void, reject: (error: unknown) => void) {
  requestQueue.push({ resolve, reject });
}

// Resolve all queued requests with the new token
function resolveQueue(newToken: string) {
  requestQueue.forEach(({ resolve }) => resolve(newToken));
  requestQueue = [];
}

function rejectQueue(error: unknown) {
  requestQueue.forEach(({ reject }) => reject(error));
  requestQueue = [];
}

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;

    // Only handle 401 & ensure no double refresh attempt
    if (error.response?.status === 401 && originalRequest._retry) {
      // Retry also got 401 — token is invalid, log the user out
      await clearTokens();
      onLogoutHandler?.();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await getRefresh();
      if (!refreshToken) {
        console.warn("401 but no refresh token");
        await clearTokens();
        onLogoutHandler?.();
        return Promise.reject(error);
      }

      // Already refreshing → queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queueRequest(
            (newAccessToken) => {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              resolve(api(originalRequest));
            },
            reject
          );
        });
      }

      // Begin refresh operation
      isRefreshing = true;
      refreshPromise = refreshAuthTokens(refreshToken);

      try {
        const { access, refresh } = await refreshPromise;

        // Save new tokens (memory + SecureStore)
        await setTokens(access, refresh);

        // Resume queued requests
        resolveQueue(access);

        // Retry this original request
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Invalid or expired refresh token
        if (isAxiosError(refreshError)) {
          const status = refreshError.response?.status;
          if (status === 400 || status === 401) {
            await clearTokens();
            rejectQueue(refreshError);
            onLogoutHandler?.();
          } else {
            // network error / 5xx etc. -> don't nuke the session
            console.warn("Token refresh failed but not logging out", {
              status,
              data: refreshError.response?.data,
            });
          }
        } else {
          console.warn("Non-Axios error during token refresh", refreshError);
        }

        return Promise.reject(refreshError);
      }

      finally {
        // Cleanup
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
