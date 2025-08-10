import api from '@/api/client';
import { AuthTokens, RegisterResponse } from '@/types/api';
import { setToken } from '@/utils/storage';

interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>('/auth/register/', data);
  return res.data;
};

export const apiLogin = async (email: string, password: string): Promise<AuthTokens> => {
  const res = await api.post<AuthTokens>('/auth/login/', { email, password });
  await setToken(res.data.access, res.data.refresh);
  return res.data;
};

export const refreshAccessToken = async (
  refresh: string
): Promise<{ access: string }> => {
  const res = await api.post<{ access: string }>('/auth/refresh/', { refresh });
  return res.data;
};
