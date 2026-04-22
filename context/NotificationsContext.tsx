// context/NotificationsContext.tsx
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, markNotificationUnread, deleteNotification as deleteNotificationApi } from '@/lib/api/notifications';
import { getErrorMessage } from '@/lib/utils/error';
import { Notification } from '@/types/api';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
  // Authoritative unread count from the server — accurate even with pagination.
  // null means not yet fetched (falls back to computed count from loaded notifications).
  const [apiUnreadCount, setApiUnreadCount] = useState<number | null>(null);
  // Ref for reading current notifications in action callbacks without stale closures.
  const notificationsRef = useRef<Notification[]>([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const fetchNotifications = useCallback(async (url?: string, mode: 'reset' | 'append' = 'reset') => {
    try {
      if (mode === 'reset' && !hasLoadedOnce) {
        setLoading(true);
      }
      const res = await getNotifications(url);
      setNextUrl(res.next ?? null);
      setNotifications((prev) => (mode === 'append' ? [...prev, ...(res.results as Notification[])] : (res.results as Notification[])));
      if (mode === 'reset') {
        // Fetch the true server-side unread count in the background so the badge
        // is accurate even for notifications not yet loaded via pagination.
        getUnreadNotificationCount().then(r => setApiUnreadCount(r.unread_count)).catch(() => {});
      }
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
    const wasUnread = notificationsRef.current.find(n => n.id === id)?.is_read === false;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    if (wasUnread) {
      setApiUnreadCount(prev => prev !== null ? Math.max(0, prev - 1) : null);
    }
    try {
      await markNotificationRead(id);
    } catch (err) {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
      if (wasUnread) {
        setApiUnreadCount(prev => prev !== null ? prev + 1 : null);
      }
      const errorMessage = getErrorMessage(err);
      console.error('Failed to mark notification as read:', errorMessage);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    const prevNotifications = notificationsRef.current;
    const prevApiUnreadCount = apiUnreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setApiUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (err) {
      // Rollback on failure
      setNotifications(prevNotifications);
      setApiUnreadCount(prevApiUnreadCount);
      const errorMessage = getErrorMessage(err);
      console.error('Failed to mark all notifications as read:', errorMessage);
      throw err;
    }
  }, [apiUnreadCount]);

  const markAsUnread = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
    );
    setApiUnreadCount(prev => prev !== null ? prev + 1 : null);
    try {
      await markNotificationUnread(id);
    } catch (err) {
      // Rollback on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setApiUnreadCount(prev => prev !== null ? Math.max(0, prev - 1) : null);
      const errorMessage = getErrorMessage(err);
      console.error('Failed to mark notification as unread:', errorMessage);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    const toRemove = notificationsRef.current.find(n => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (toRemove && !toRemove.is_read) {
      setApiUnreadCount(prev => prev !== null ? Math.max(0, prev - 1) : null);
    }
    try {
      await deleteNotificationApi(id);
    } catch (err) {
      // Rollback on failure
      if (toRemove) {
        setNotifications((prev) => {
          const idx = prev.findIndex((n) => n.id > id);
          const copy = [...prev];
          copy.splice(idx === -1 ? copy.length : idx, 0, toRemove);
          return copy;
        });
        if (!toRemove.is_read) {
          setApiUnreadCount(prev => prev !== null ? prev + 1 : null);
        }
      }
      const errorMessage = getErrorMessage(err);
      console.error('Failed to delete notification:', errorMessage);
      throw err;
    }
  }, []);


  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  const computedUnreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );
  const unreadCount = apiUnreadCount ?? computedUnreadCount;

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
