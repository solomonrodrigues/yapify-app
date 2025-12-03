// lib/utils/storage.ts
import * as SecureStore from 'expo-secure-store';

// Refresh token
export const setRefresh = async (refresh: string) => {
  await SecureStore.setItemAsync('refreshToken', refresh);
};

export const getRefresh = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('refreshToken');
  } catch (e) {
    console.warn("Failed reading refresh token:", e);
    return null;
  }
};

// Access token
let accessToken: string | null = null;

export const setAccess = (token: string | null) => {
  accessToken = token;
};

export const getAccess = () => accessToken;

// Helpers
export const setTokens = async (access: string, refresh: string) => {
  setAccess(access);
  await setRefresh(refresh);
};

export const clearTokens = async () => {
  accessToken = null;
  await SecureStore.deleteItemAsync('refreshToken');
};
