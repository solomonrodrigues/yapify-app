import { PaginatedNotificationList } from '../../types/api';
import api from './client';

export const getNotifications = async (url?: string | null): Promise<PaginatedNotificationList> => {
  // ToDo: Solve the issue of next urls using http, instead of https
  const toRelative = (u: string) => {
    // Base helps resolve relative inputs too
    const base = new URL(String((api.defaults as any).baseURL || window.location.origin));
    const abs = new URL(u, base);
    let result = abs.pathname + abs.search + abs.hash; // no origin -> uses api.baseURL
    if (result.startsWith('/api/')) {
      result = result.replace(/^\/api/, '');
    }
    return result;
  };

  const endpoint = url ? toRelative(url) : '/notifications/';
  console.log(endpoint);
  const res = await api.get<PaginatedNotificationList>(endpoint);
  return res.data;
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read/`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.post('/notifications/read/');
};
