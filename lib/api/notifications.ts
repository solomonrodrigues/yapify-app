import { PaginatedNotificationList } from '../../types/api';
import api from './client';

export const getNotifications = async (url?: string | null): Promise<PaginatedNotificationList> => {
  // Convert absolute URLs to relative paths to work around the API returning http:// URLs
  // instead of https://. By using relative paths, we rely on api.baseURL which is properly configured.
  const toRelative = (u: string) => {
    const base = new URL(String((api.defaults as any).baseURL || 'https://localhost'));
    const abs = new URL(u, base);
    let result = abs.pathname + abs.search + abs.hash;
    if (result.startsWith('/api/')) {
      result = result.replace(/^\/api/, '');
    }
    return result;
  };

  const endpoint = url ? toRelative(url) : '/notifications/';
  const res = await api.get<PaginatedNotificationList>(endpoint);
  return res.data;
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read/`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.post('/notifications/read/');
};

export const markNotificationUnread = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/unread/`);
};

export const deleteNotification = async (notificationId: number): Promise<void> => {
  await api.delete(`/notifications/${notificationId}/`);
};
