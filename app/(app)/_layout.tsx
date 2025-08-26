import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.text, // back arrow & title color
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: { color: theme.text },
        headerBackTitle: "Back", // iOS back label
      }}
    >
        <Stack.Screen name="menu" options={{ headerShown: true, headerTitle: 'Account settings', headerBackTitle: 'Back' }} />
        <Stack.Screen name="user/[userID]" options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
