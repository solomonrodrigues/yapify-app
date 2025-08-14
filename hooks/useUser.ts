import { useState, useEffect, useCallback } from "react";
import { getProfile, updateProfile } from "@/api/profile";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/api";

export function useUser() {
  const { isLoggedIn } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!isLoggedIn) {
      setUser(null);
      return;
    }
    setLoading(true);
    try {
      const profile = await getProfile();
      setUser(profile);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const saveUser = useCallback(async (updates: Partial<User>) => {
    const updated = await updateProfile(updates);
    setUser(updated);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    refetch: fetchUser,
    update: saveUser,
  };
}
