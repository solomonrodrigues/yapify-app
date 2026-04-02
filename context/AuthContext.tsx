import { apiLogin } from "@/lib/api/auth";
import { deregisterDeviceToken } from "@/lib/api/devices";
import { refreshAuthTokens, setOnLogoutHandler } from "@/lib/api/client";
import { addPendingDeregistration, clearPushToken, clearTokens, getPushToken, getRefresh, setTokens } from "@/lib/utils/storage";
import { isAxiosError } from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { View } from "react-native";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeLogin: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authKey, setAuthKey] = useState(0);

  async function checkAuth() {
    setIsLoading(true);
    try {
      // 1. Look for a refresh token (access is memory-only, so ignore it on cold start)
      const refreshToken = await getRefresh();

      if (!refreshToken) {
        // No refresh token means definitely logged out
        setIsLoggedIn(false);
        return;
      }

      // 2. Try to refresh tokens, forwarding push token so the backend can update
      //    last_refreshed_at on this specific device only (not all user devices).
      const pushToken = await getPushToken();
      const { access, refresh } = await refreshAuthTokens(refreshToken, pushToken ?? undefined);
      await setTokens(access, refresh);

      // 3. If we got here, we’re authenticated
      setIsLoggedIn(true);
    } catch (e) {
      const isAuthError = isAxiosError(e) && (e.response?.status === 400 || e.response?.status === 401);
      if (isAuthError) {
        // Token is genuinely invalid — clear the session
        await clearTokens();
        setIsLoggedIn(false);
      } else {
        // Network or server error — the token may still be valid, don't nuke the session.
        // Treat as logged in and let DataPreloader surface the failure with a retry option.
        setIsLoggedIn(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await apiLogin(email, password);
    setIsLoggedIn(true);
  }

  function completeLogin() {
    setIsLoggedIn(true);
  }

  async function logout() {
    // Best-effort deregister — don't let a network failure block the user from logging out
    const pushToken = await getPushToken();
    if (pushToken) {
      try {
        await deregisterDeviceToken(pushToken);
      } catch {
        // Network failure — queue for retry on next cold start. The backend's
        // unauthenticated DELETE /api/devices/ path accepts the token as the
        // credential, so this works even after the session is cleared.
        await addPendingDeregistration(pushToken);
      }
      await clearPushToken();
    }

    await clearTokens();
    setIsLoggedIn(false);
    setAuthKey((k) => k + 1); // forces remount of children
  }

  useEffect(() => {
    checkAuth();

    // Set the logout handler for API client to call on 401
    setOnLogoutHandler(() => {
      logout();
    });
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isLoggedIn, login, completeLogin, logout, checkAuth }}>
      {/* everything inside remounts on logout */}
      <View key={authKey} style={{ flex: 1 }}>{children}</View>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
