import { useState, useEffect, useCallback } from "react";
import { getProfile, updateProfile } from "@/api/profile";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/api";

export function useUser() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const profile = await getProfile();
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const saveUser = useCallback(async (updates: Partial<User>) => {
    const updated = await updateProfile(updates);
    setUser(updated);
  }, []);

  useEffect(() => {
    // Only fetch quotes when authenticated and auth check is complete
    if (isLoggedIn && !authLoading) {
      fetchUser(); // initial fetch
    }
  }, [isLoggedIn, authLoading]);

  return {
    user,
    loading,
    refetch: fetchUser,
    update: saveUser,
  };
}
