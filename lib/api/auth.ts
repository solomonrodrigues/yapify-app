// lib/api/auth.ts
import { authClient } from '@/lib/api/client';
import { setTokens } from '@/lib/utils/storage';
import { DetailResponse, PasswordResetConfirm, RegisterResponse, TokenRefresh, UserRegistration, VerifyEmailResponse } from '@/types/api';

export const register = async (data: UserRegistration): Promise<RegisterResponse> => {
  const res = await authClient.post<RegisterResponse>('/auth/register/', data);
  return res.data;
};

export const apiLogin = async (email: string, password: string): Promise<TokenRefresh> => {
  const res = await authClient.post<TokenRefresh>('/auth/login/', { email, password });
  await setTokens(res.data.access, res.data.refresh);
  return res.data;
};

export const verifyEmail = async (email: string, code: string): Promise<VerifyEmailResponse> => {
  const res = await authClient.post<VerifyEmailResponse>('/auth/verify-email/', { email, code });
  await setTokens(res.data.access, res.data.refresh);
  return res.data;
};

export const resendVerificationCode = async (email: string): Promise<DetailResponse> => {
  const res = await authClient.post<DetailResponse>('/auth/resend-verification/', { email });
  return res.data;
};

export const sendPasswordReset = async (email: string): Promise<DetailResponse> => {
  const res = await authClient.post<DetailResponse>('/auth/password-reset/', { email });
  return res.data;
};

export const confirmPasswordReset = async (
  data: PasswordResetConfirm
): Promise<DetailResponse> => {
  const res = await authClient.post<DetailResponse>('/auth/password-reset/confirm/', data);
  return res.data;
};
