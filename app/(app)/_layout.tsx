// app/(app)/_layout.tsx
import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
  const { isLoggedIn, isLoading } = useAuth();

  // While auth state is being restored, don't render anything yet
  if (isLoading) return null;

  // If not logged in, NO access to app group → go to auth
  if (!isLoggedIn) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="my-account" options={{ headerShown: true, headerTitle: 'My Account', headerBackTitle: 'Back' }} />
      <Stack.Screen name="saved-quotes" options={{ headerShown: true, headerTitle: 'Saved Quotes', headerBackTitle: 'Back' }} />
      <Stack.Screen name="user/[userID]" options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, headerTitle: '', headerBackTitle: 'Back' }} />

      {/* Modal group */}
      <Stack.Screen
        name="(modals)/quote-actions"
        options={{
          presentation: 'transparentModal',
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
