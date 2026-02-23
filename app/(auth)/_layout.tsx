// app/(auth)/_layout.tsx
import { useAuth } from '@/context/AuthContext';
import { hasCompletedOnboarding } from '@/lib/utils/storage';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  // On first install, redirect to onboarding before showing login
  useEffect(() => {
    if (isLoading || isLoggedIn) return;

    hasCompletedOnboarding().then((completed) => {
      if (!completed) {
        router.replace('/(auth)/onboarding');
      }
    });
  }, [isLoading, isLoggedIn]);

  // While auth state is being restored, don't render anything yet
  if (isLoading) return null;

  // If logged in, NO access to auth group → go to app
  if (isLoggedIn) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
