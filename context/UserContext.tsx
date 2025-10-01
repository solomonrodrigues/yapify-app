// context/UserContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getProfile, updateProfile } from "@/api/profile";
import { User } from "@/types/api";
import { getErrorMessage } from '@/utils/error';

interface UserContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  hasLoadedOnce: boolean;
  loadUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadUser = useCallback(async () => {
    if (!hasLoadedOnce) {
      setLoading(true);
    }

    try {
      const profile = await getProfile();
      setUser(profile);
      setError(null);
      setHasLoadedOnce(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [hasLoadedOnce]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      const updated = await updateProfile(updates);
      setUser(updated);
      setError(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      loading,
      error,
      hasLoadedOnce,
      loadUser,
      updateUser,
      refetch: loadUser,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
