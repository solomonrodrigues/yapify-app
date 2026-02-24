import { useAuth } from '@/context/AuthContext';
import { getFriends, getRecentFriends } from '@/lib/api/friends';
import { deleteRecent, listRecentUsers, postRecentUserClick } from '@/lib/api/recents';
import { MinimalUser, User } from '@/types/api';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface FriendsContextValue {
  /** Full friends list — used by QuotePostModal */
  friends: User[];
  /** Recently quoted friends — used by QuotePostModal */
  recentFriends: User[];
  /** Recently viewed users via search — used by search screen */
  recentUsers: MinimalUser[];
  loading: boolean;
  refresh: () => Promise<void>;
  /** Optimistically move a user to the top of recentUsers (call on search result tap) */
  upsertRecentUser: (user: MinimalUser, query?: string) => void;
  /** Optimistically remove a user from recentUsers with rollback on API failure */
  removeRecentUser: (user: MinimalUser) => void;
}

const FriendsContext = createContext<FriendsContextValue | null>(null);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [recentFriends, setRecentFriends] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<MinimalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsResult, recentFriendsResult, recentUsersResult] = await Promise.allSettled([
        getFriends(),
        getRecentFriends(),
        listRecentUsers(10),
      ]);
      if (friendsResult.status === 'fulfilled') setFriends(friendsResult.value);
      if (recentFriendsResult.status === 'fulfilled') setRecentFriends(recentFriendsResult.value);
      if (recentUsersResult.status === 'fulfilled') setRecentUsers(recentUsersResult.value);
    } finally {
      setLoading(false);
    }
  }, []);

  // Background prefetch once authenticated — not blocking, no DataPreloader involvement.
  // Data is ready by the time the user opens the post modal or navigates to search.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAll();
  }, [isLoggedIn, fetchAll]);

  const upsertRecentUser = useCallback((user: MinimalUser, query?: string) => {
    setRecentUsers((prev) =>
      [user, ...prev.filter((u) => u.id !== user.id)].slice(0, 10)
    );
    postRecentUserClick(user, query).catch(() => {});
  }, []);

  const removeRecentUser = useCallback((user: MinimalUser) => {
    setRecentUsers((prev) => prev.filter((u) => u.id !== user.id));
    deleteRecent('user', user.id).catch(() => {
      // Rollback on API failure
      setRecentUsers((prev) => [...prev, user].slice(0, 10));
    });
  }, []);

  return (
    <FriendsContext.Provider
      value={{
        friends,
        recentFriends,
        recentUsers,
        loading,
        refresh: fetchAll,
        upsertRecentUser,
        removeRecentUser,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within FriendsProvider');
  return ctx;
}
