import api from './client';
import { Notification } from '../types/api';

export const getNotifications = async (): Promise<Notification[]> => {
  const res = await api.get<Notification[]>('/notifications/');
  return res.data;
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read/`);
};
