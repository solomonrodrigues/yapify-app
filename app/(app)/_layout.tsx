// app/(app)/_layout.tsx
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack, useRouter } from "expo-router";
import { Platform, useColorScheme } from "react-native";
import { HeaderBackButton } from "@react-navigation/elements";

export default function AppLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const isIOS = Platform.OS === 'ios';
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();

  // While auth state is being restored, don't render anything yet
  if (isLoading) return null;

  // If not logged in, NO access to app group → go to auth
  if (!isLoggedIn) {
    return <Redirect href="/(auth)" />;
  }

  // Custom back handler - ensures navigation always works
  const handleBackPress = (fallbackRoute: string) => () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to specified route if no history
      router.replace(fallbackRoute);
    }
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="[quoteID]" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen
        name="my-account"
        options={{
          headerShown: true,
          headerTitle: 'My Account',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/(tabs)/profile')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/(tabs)/profile')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="saved-quotes"
        options={{
          headerShown: true,
          headerTitle: 'Saved Quotes',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/(tabs)/profile')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          headerShown: true,
          headerTitle: 'Privacy & Security',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/my-account')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="blocked-users"
        options={{
          headerShown: true,
          headerTitle: 'Blocked Users',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/privacy-security')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="hidden-quotes"
        options={{
          headerShown: true,
          headerTitle: 'Hidden Quotes',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/privacy-security')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="help-support"
        options={{
          headerShown: true,
          headerTitle: 'Help & Support',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/my-account')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="user/[userID]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/(tabs)/profile')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen name="onboarding" options={{ headerShown: false, headerTitle: '', headerBackTitle: 'Back' }} />

      {/* Modal group */}
      <Stack.Screen
        name="(modals)/quote-actions"
        options={{
          presentation: isIOS ? "formSheet" : "transparentModal",
          headerShown: false,
          ...(isIOS && {
            sheetAllowedDetents: "fitToContents",
            sheetGrabberVisible: true,
          }),
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      />
    </Stack>
  );
}
