// api/client.ts
import { clearTokens, getAccessToken, getRefreshToken, setToken } from '@/lib/utils/storage';
import axios, { AxiosError, AxiosInstance } from 'axios';

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

export const refreshAccessToken = async (
  refresh: string
): Promise<{ access: string }> => {
  const res = await authClient.post<{ access: string }>('/auth/refresh/', { refresh });
  return res.data;
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any; // Cast to any to add custom property
    
    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const newTokens = await refreshAccessToken(refreshToken);
        await setToken(newTokens.access, refreshToken);

        // Mark this request as retried and try again
        originalRequest._retry = true;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        }
        
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed - user needs to log in again
        await clearTokens();
        if (onLogoutHandler) {
          onLogoutHandler();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
