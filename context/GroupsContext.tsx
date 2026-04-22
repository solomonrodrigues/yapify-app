import { useAuth } from '@/context/AuthContext';
import { getGroups, getPendingInvites, Group, GroupInvite } from '@/lib/api/groups';
import { deleteRecent, listRecentUsers, postRecentUserClick } from '@/lib/api/recents';
import { MinimalUser } from '@/types/api';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface GroupsContextValue {
  groups: Group[];
  /** The currently selected group for feed filtering (null = all groups) */
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;
  pendingInvites: GroupInvite[];
  /** Recently viewed users via search */
  recentUsers: MinimalUser[];
  loading: boolean;
  /** Refetch groups, pending invites, and recent users */
  refresh: () => Promise<void>;
  /** Targeted refresh: re-fetches only the groups list */
  refreshGroups: () => Promise<void>;
  /** Targeted refresh: re-fetches only pending invites */
  refreshPendingInvites: () => Promise<void>;
  /** Optimistically move a user to the top of recentUsers (call on search result tap) */
  upsertRecentUser: (user: MinimalUser, query?: string) => void;
  /** Optimistically remove a user from recentUsers with rollback on API failure */
  removeRecentUser: (user: MinimalUser) => void;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [pendingInvites, setPendingInvites] = useState<GroupInvite[]>([]);
  const [recentUsers, setRecentUsers] = useState<MinimalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsResult, invitesResult, recentUsersResult] = await Promise.allSettled([
        getGroups(),
        getPendingInvites(),
        listRecentUsers(10),
      ]);
      if (groupsResult.status === 'fulfilled') setGroups(groupsResult.value);
      if (invitesResult.status === 'fulfilled') setPendingInvites(invitesResult.value.results);
      if (recentUsersResult.status === 'fulfilled') setRecentUsers(recentUsersResult.value);
    } finally {
      setLoading(false);
    }
  }, []);

  // Background prefetch once authenticated — data is ready before the user needs it.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAll();
  }, [isLoggedIn, fetchAll]);

  const refreshGroups = useCallback(async () => {
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to refresh groups', err);
    }
  }, []);

  const refreshPendingInvites = useCallback(async () => {
    try {
      const data = await getPendingInvites();
      setPendingInvites(data.results);
    } catch (err) {
      console.error('Failed to refresh pending invites', err);
    }
  }, []);

  const upsertRecentUser = useCallback((user: MinimalUser, query?: string) => {
    setRecentUsers((prev) =>
      [user, ...prev.filter((u) => u.id !== user.id)].slice(0, 10)
    );
    postRecentUserClick(user, query).catch(() => {});
  }, []);

  const removeRecentUser = useCallback((user: MinimalUser) => {
    setRecentUsers((prev) => prev.filter((u) => u.id !== user.id));
    deleteRecent('user', user.id).catch(() => {
      setRecentUsers((prev) => [...prev, user].slice(0, 10));
    });
  }, []);

  return (
    <GroupsContext.Provider
      value={{
        groups,
        currentGroup,
        setCurrentGroup,
        pendingInvites,
        recentUsers,
        loading,
        refresh: fetchAll,
        refreshGroups,
        refreshPendingInvites,
        upsertRecentUser,
        removeRecentUser,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error('useGroups must be used within GroupsProvider');
  return ctx;
}
