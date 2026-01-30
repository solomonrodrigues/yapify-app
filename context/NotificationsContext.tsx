// context/NotificationsContext.tsx
import { getNotifications, markAllNotificationsRead, markNotificationRead, markNotificationUnread, deleteNotification as deleteNotificationApi } from '@/lib/api/notifications';
import { getErrorMessage } from '@/lib/utils/error';
import { Friendship, Notification } from '@/types/api';
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface NotificationsContextValue {
  notifications: Notification[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasLoadedOnce: boolean;
  nextUrl: string | null;
  unreadCount: number;
  fetchNotifications: (url?: string, mode?: 'reset' | 'append') => Promise<void>;
  loadMore: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsUnread: (id: number) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  updateFriendship: (notificationId: number, friendship: Friendship | null) => void;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchNotifications = useCallback(async (url?: string, mode: 'reset' | 'append' = 'reset') => {
    try {
      if (mode === 'reset' && !hasLoadedOnce) {
        setLoading(true);
      }
      const res = await getNotifications(url);
      setNextUrl(res.next ?? null);
      setNotifications((prev) => (mode === 'append' ? [...prev, ...res.results] : res.results));
      setError(null);
      setHasLoadedOnce(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [hasLoadedOnce]);

  const loadMore = useCallback(() => {
    if (!loadingMore && nextUrl) {
      setLoadingMore(true);
      fetchNotifications(nextUrl, 'append');
    }
  }, [loadingMore, nextUrl, fetchNotifications]);

  const markAsRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await markNotificationRead(id);
    } catch (err) {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
      const errorMessage = getErrorMessage(err);
      console.error('Failed to mark notification as read:', errorMessage);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      // Update all notifications to is_read: true
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      console.error('Failed to mark all notifications as read:', errorMessage);
      throw err;
    }
  }, []);

  const markAsUnread = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
    );
    try {
      await markNotificationUnread(id);
    } catch (err) {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      const errorMessage = getErrorMessage(err);
      console.error('Failed to mark notification as unread:', errorMessage);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    let removed: Notification | undefined;
    setNotifications((prev) => {
      removed = prev.find((n) => n.id === id);
      return prev.filter((n) => n.id !== id);
    });
    try {
      await deleteNotificationApi(id);
    } catch (err) {
      // Rollback on failure
      if (removed) {
        setNotifications((prev) => {
          const idx = prev.findIndex((n) => n.id > id);
          const copy = [...prev];
          copy.splice(idx === -1 ? copy.length : idx, 0, removed!);
          return copy;
        });
      }
      const errorMessage = getErrorMessage(err);
      console.error('Failed to delete notification:', errorMessage);
      throw err;
    }
  }, []);

  const updateFriendship = useCallback((notificationId: number, friendship: Friendship | null) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, friendship, is_read: true }
          : n
      )
    );
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  return (
    <NotificationsContext.Provider value={{
      notifications,
      loading,
      refreshing,
      loadingMore,
      error,
      hasLoadedOnce,
      nextUrl,
      unreadCount,
      fetchNotifications,
      loadMore,
      markAsRead,
      markAllAsRead,
      markAsUnread,
      deleteNotification,
      updateFriendship,
      refresh,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
