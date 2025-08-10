import React, { createContext, useContext, useState, useEffect } from "react";
import { getAccessToken, clearTokens } from "@/utils/storage";
import { setOnLogoutHandler } from "@/api/client";

interface AuthContextType {
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function checkAuth() {
    const token = await getAccessToken();
    setIsLoggedIn(!!token);
  }

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
    <AuthContext.Provider value={{ isLoggedIn, logout, checkAuth }}>
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
