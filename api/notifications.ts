import api from './client';
import { PaginatedNotificationList } from '../types/api';

export const getNotifications = async (): Promise<PaginatedNotificationList> => {
  const res = await api.get<PaginatedNotificationList>('/notifications/');
  return res.data;
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read/`);
};
