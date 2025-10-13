import api from '@/lib/api/client';
import { setToken } from '@/lib/utils/storage';
import { RegisterResponse, TokenRefresh, UserRegistration } from '@/types/api';

export const register = async (data: UserRegistration): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>('/auth/register/', data);
  return res.data;
};

export const apiLogin = async (email: string, password: string): Promise<TokenRefresh> => {
  const res = await api.post<TokenRefresh>('/auth/login/', { email, password });
  await setToken(res.data.access, res.data.refresh);
  return res.data;
};

type SimpleDetail = { detail: string };  // Placeholder type

export const verifyEmail = async (email: string, code: string): Promise<SimpleDetail> => {
  const res = await api.post<SimpleDetail>('/auth/verify-email/', { email, code });
  return res.data;
};

export const resendVerificationCode = async (email: string): Promise<SimpleDetail> => {
  const res = await api.post<SimpleDetail>('/auth/resend-verification/', { email });
  return res.data;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  console.log("ToDo: Implement sendPasswordReset API call");
}
