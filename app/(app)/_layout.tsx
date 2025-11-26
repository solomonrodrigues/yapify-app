import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    >
        <Stack.Screen name="menu" options={{ headerShown: true, headerTitle: 'Account settings', headerBackTitle: 'Back' }} />
        <Stack.Screen name="user/[userID]" options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, headerTitle: '', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
