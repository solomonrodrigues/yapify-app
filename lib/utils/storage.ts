// lib/utils/storage.ts
import * as SecureStore from 'expo-secure-store';

// Refresh token (persisted in SecureStore)
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

// Access token (in-memory only)
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

// Push token (persisted in SecureStore so it survives until logout)
export const setPushToken = async (token: string) => {
  await SecureStore.setItemAsync('expoPushToken', token);
};

export const getPushToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync('expoPushToken');
  } catch (e) {
    console.warn("Failed reading push token:", e);
    return null;
  }
};

export const clearPushToken = async () => {
  await SecureStore.deleteItemAsync('expoPushToken');
};

// Onboarding
const ONBOARDING_KEY = 'onboardingComplete';

export const markOnboardingComplete = async () => {
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
};

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};

export const resetOnboarding = async () => {
  await SecureStore.deleteItemAsync(ONBOARDING_KEY);
};
