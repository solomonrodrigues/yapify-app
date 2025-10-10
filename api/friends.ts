import api from './client';
import { PublicUser, User } from '../types/api';

export const searchUsers = async (query: string): Promise<User[]> => {
    const res = await api.get<{ results: User[] }>(`/users/search/?search=${encodeURIComponent(query)}`);
    return res.data.results || [];
};

export const getUser = async (userId: number): Promise<PublicUser> => {
    const res = await api.get(`/users/${userId}/`);
    return res.data;
};

export const getFriends = async (): Promise<User[]> => {
    const res = await api.get<{ results: User[] }>('/friends/');
    return res.data.results || [];
};

export const getRecentFriends = async (): Promise<User[]> => {
    const res = await api.get<{ results: User[] }>('/friends/recent-quoted/');
    return res.data.results || [];
};

export const searchFriends = async (query: string): Promise<User[]> => {
    const res = await api.get<{ results: User[] }>(`/friends/?search=${encodeURIComponent(query)}`);
    return res.data.results || [];
};

export const getFriendRequests = async () => {
    const res = await api.get('/friends/requests/');
    return res.data;
};

export const sendFriendRequest = async (receiverId: number) => {
    const res = await api.post('/friends/send/', { receiver_id: receiverId });
    return res.data;
};

export const respondToFriendRequest = async (friendshipId: number, action: 'accept' | 'reject') => {
    const res = await api.post(`/friends/respond/${friendshipId}/`, { action });
    return res.data;
};

export const cancelFriendRequest = async (receiverId: number) => {
    // ToDo: Implement properly
    return null;
}

export const unfriend = async (receiverId: number) => {
    // ToDo: Implement properly
    return null;
}
