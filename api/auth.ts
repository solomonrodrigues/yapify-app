import api from '@/api/client';
import { TokenRefresh, RegisterResponse, UserRegistration } from '@/types/api';
import { setToken } from '@/utils/storage';

export const register = async (data: UserRegistration): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>('/auth/register/', data);
  return res.data;
};

export const apiLogin = async (email: string, password: string): Promise<TokenRefresh> => {
  const res = await api.post<TokenRefresh>('/auth/login/', { email, password });
  await setToken(res.data.access, res.data.refresh);
  return res.data;
};
