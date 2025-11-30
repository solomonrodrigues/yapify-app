// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function RootIndex() {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return null; // keep splash up until ready

  return (
    <Redirect href={isLoggedIn ? '/(app)/(tabs)' : '/(auth)'} />
  );
}
