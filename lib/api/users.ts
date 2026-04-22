import { PaginatedPublicUserList, PublicUser, ReportReasonEnum } from '../../types/api';
import api from './client';

export const searchUsers = async (
  query: string,
  url?: string | null,
): Promise<PaginatedPublicUserList> => {
  if (!query.trim()) return { count: 0, results: [] };
  if (url) {
    const res = await api.get<PaginatedPublicUserList>(url);
    return res.data;
  }
  const res = await api.get<PaginatedPublicUserList>(`/users/search/?search=${encodeURIComponent(query)}`);
  return res.data;
};

export const getUser = async (userId: number): Promise<PublicUser> => {
  const res = await api.get<PublicUser>(`/users/${userId}/`);
  return res.data;
};

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
 * Report a user.
 */
export const reportUser = async (
  userId: number,
  body: { reason: ReportReasonEnum; description?: string | null }
): Promise<void> => {
  await api.post(`/users/${userId}/report/`, body);
};

/**
 * Unreport a user.
 */
export const unreportUser = async (userId: number): Promise<void> => {
  await api.delete(`/users/${userId}/report/`);
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
