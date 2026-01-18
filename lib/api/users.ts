import { PaginatedPublicUserList } from '../../types/api';
import api from './client';

/**
 * Block a user.
 */
export const blockUser = async (userId: number): Promise<void> => {
  await api.post(`/users/${userId}/block/`);
};

/**
 * Unblock a user.
 */
export const unblockUser = async (userId: number): Promise<void> => {
  await api.delete(`/users/${userId}/block/`);
};

/**
 * Get list of blocked users.
 */
export const getBlockedUsers = async (
  url?: string | null
): Promise<PaginatedPublicUserList> => {
  const endpoint = url ?? '/users/blocked/';
  const res = await api.get<PaginatedPublicUserList>(endpoint);
  return res.data;
};
