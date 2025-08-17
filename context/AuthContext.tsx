import React, { createContext, useContext, useState, useEffect } from "react";
import { getAccessToken, clearTokens } from "@/utils/storage";
import { setOnLogoutHandler } from "@/api/client";
import { apiLogin } from "@/api/auth";
import { TokenRefresh } from "@/types/api";

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

  async function checkAuth() {
    const token = await getAccessToken();
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
      {children}
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
