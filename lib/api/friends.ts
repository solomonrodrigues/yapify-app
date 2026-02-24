import { PaginatedPublicUserList, PaginatedPublicUserListList, PublicUser, User } from '../../types/api';
import api from './client';

export const searchUsers = async (
    query: string,
    url?: string | null,
): Promise<PaginatedPublicUserListList> => {
    if (!query.trim()) return { count: 0, results: [] };

    if (url) {
        const res = await api.get<PaginatedPublicUserListList>(url);
        return res.data;
    }

    const res = await api.get<PaginatedPublicUserListList>(`/users/search/?search=${encodeURIComponent(query)}`);
    return res.data;
};

export const getUser = async (userId: number): Promise<PublicUser> => {
    const res = await api.get(`/users/${userId}/`);
    return res.data;
};

export const getFriends = async (url?: string | null): Promise<{ results: User[]; next: string | null }> => {
    const endpoint = url ?? '/friends/';
    const res = await api.get<{ results: User[]; next?: string | null }>(endpoint);
    return {
        results: res.data.results ?? [],
        next: res.data.next ?? null,
    };
};

export const getRecentFriends = async (): Promise<User[]> => {
    const res = await api.get<{ results: User[] }>('/friends/recent-quoted/');
    return res.data.results || [];
};

export const searchFriends = async (query: string): Promise<User[]> => {
    const res = await api.get<{ results: User[] }>(`/friends/?search=${encodeURIComponent(query)}`);
    return res.data.results || [];
};

/**
 * Fetch a user's friends.
 *
 * - If `options.url` is provided, it is used as-is.
 * - Otherwise, the endpoint is constructed from `userId` and optional `search`.
 */
export const getUserFriends = async (
    userId: number,
    options?: {
      url?: string | null;
      search?: string;
    }
): Promise<PaginatedPublicUserList> => {
    let endpoint: string;
  
    if (options?.url) {
      endpoint = options.url;
    } else {
      // Build the base endpoint for this user's friends
      const params = new URLSearchParams();
      if (options?.search) {
        params.set('search', options.search);
      }
      const queryString = params.toString();
      endpoint = `/users/${userId}/friends/${queryString ? `?${queryString}` : ''}`;
    }
  
    const res = await api.get<PaginatedPublicUserList>(endpoint);
    return res.data;
};

export const getFriendRequests = async () => {
    const res = await api.get('/friends/requests/');
    return res.data;
};

export const sendFriendRequest = async (receiverId: number) => {
    const res = await api.post('/friends/send/', { receiver_id: receiverId });
    return res.data;
};

export const cancelFriendRequest = async (receiverId: number) => {
    await api.delete(`/friends/${receiverId}/cancel/`);
    return;
};

export const unfriend = async (receiverId: number) => {
    await api.delete(`/friends/${receiverId}/unfriend/`);
    return;
};

export const respondToFriendRequest = async (userId: number, action: 'accept' | 'reject') => {
    const res = await api.post(`/friends/${userId}/respond/`, { action });
    return res.data;
};
