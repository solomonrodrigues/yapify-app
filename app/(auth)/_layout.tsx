// app/(auth)/_layout.tsx
import { useAuth } from '@/context/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isLoggedIn, isLoading } = useAuth();

  // While auth state is being restored, don't render anything yet
  if (isLoading) return null;

  // If logged in, NO access to auth group → go to app
  if (isLoggedIn) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
