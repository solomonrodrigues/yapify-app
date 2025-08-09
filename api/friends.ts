import api from './client';
import { User } from '../types/api';

export const searchUsers = async (query: string): Promise<User[]> => {
    const res = await api.get<{ results: User[] }>(`/users/search/?q=${encodeURIComponent(query)}`);
    console.log('Search results:', res.data);
    return res.data.results || [];
};

export const getFriends = async (): Promise<User[]> => {
    const res = await api.get<{ results: User[] }>('/friends/');
    return res.data.results || [];
};


export const getFriendRequests = async () => {
    const res = await api.get('/friends/requests/');
    return res.data;
};

export const sendFriendRequest = async (receiverId: number) => {
    const res = await api.post('/friends/send/', { receiver: receiverId });
    console.log('Friend request sent:', res.data);
    return res.data;
};

export const respondToFriendRequest = async (friendshipId: number, action: 'accept' | 'reject') => {
    const res = await api.post(`/friends/respond/${friendshipId}/`, { action });
    return res.data;
};
