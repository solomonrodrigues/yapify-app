import api from './client';
import type { MinimalUser } from '@/types/api';

export interface Group {
  id: number;
  name: string;
  created_by: MinimalUser;
  member_count: number;
  is_admin: boolean;
  created_at: string;
}

export interface GroupMember {
  user: MinimalUser;
  joined_at: string;
}

export interface GroupInvite {
  id: number;
  group: Group;
  invited_by: MinimalUser;
  invited_user: MinimalUser;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export const getGroups = async (): Promise<Group[]> => {
  const res = await api.get<Group[]>('/groups/');
  return res.data;
};

export const createGroup = async (name: string): Promise<Group> => {
  const res = await api.post<Group>('/groups/', { name });
  return res.data;
};

export const getGroup = async (groupId: number): Promise<Group> => {
  const res = await api.get<Group>(`/groups/${groupId}/`);
  return res.data;
};

export const renameGroup = async (groupId: number, name: string): Promise<Group> => {
  const res = await api.patch<Group>(`/groups/${groupId}/`, { name });
  return res.data;
};

export const deleteGroup = async (groupId: number): Promise<void> => {
  await api.delete(`/groups/${groupId}/`);
};

export const getGroupMembers = async (
  groupId: number,
  url?: string | null,
  search?: string,
): Promise<{ results: GroupMember[]; next: string | null; count: number }> => {
  const endpoint = url ?? `/groups/${groupId}/members/`;
  const params = search ? { search } : undefined;
  const res = await api.get<{ results: GroupMember[]; next?: string | null; count: number }>(endpoint, { params });
  return { results: res.data.results ?? [], next: res.data.next ?? null, count: res.data.count };
};

export const kickMember = async (groupId: number, userId: number): Promise<void> => {
  await api.delete(`/groups/${groupId}/members/${userId}/`);
};

export const leaveGroup = async (groupId: number): Promise<void> => {
  await api.post(`/groups/${groupId}/leave/`);
};

export const inviteToGroup = async (groupId: number, userId: number): Promise<GroupInvite> => {
  const res = await api.post<GroupInvite>(`/groups/${groupId}/invite/`, { user_id: userId });
  return res.data;
};

export const getPendingInvites = async (): Promise<{ results: GroupInvite[]; count: number }> => {
  const res = await api.get<{ results: GroupInvite[]; count: number }>('/groups/invites/');
  return res.data;
};

export const respondToInvite = async (
  inviteId: number,
  action: 'accept' | 'decline',
): Promise<GroupInvite> => {
  const res = await api.post<GroupInvite>(`/groups/invites/${inviteId}/respond/`, { action });
  return res.data;
};

export const cancelInvite = async (inviteId: number): Promise<void> => {
  await api.delete(`/groups/invites/${inviteId}/`);
};
