import { apiLogin } from "@/lib/api/auth";
import { setOnLogoutHandler } from "@/lib/api/client";
import { clearTokens, getAccess } from "@/lib/utils/storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { View } from "react-native";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authKey, setAuthKey] = useState(0);

  async function checkAuth() {
    const token = await getAccess();
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }

  async function login(email: string, password: string) {
    await apiLogin(email, password);
    setIsLoggedIn(true);
  };

  async function logout() {
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
    <AuthContext.Provider value={{ isLoading, isLoggedIn, login, logout, checkAuth }}>
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
