import { User } from '../../types/api';
import api from './client';

export const getProfile = async (): Promise<User> => {
  const res = await api.get<User>('/profile/');
  return res.data;
};

export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const res = await api.patch<User>('/profile/', updates);
  return res.data;
};

export const deleteAccount = async (): Promise<void> => {
  await api.delete('/auth/me/');
};
