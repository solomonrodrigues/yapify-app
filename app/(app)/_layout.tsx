// app/(app)/_layout.tsx
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { registerDeviceToken } from "@/lib/api/devices";
import { getPushToken, setPushToken } from "@/lib/utils/storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Redirect, Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform, useColorScheme } from "react-native";
import { HeaderBackButton } from "@react-navigation/elements";

export default function AppLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const isIOS = Platform.OS === 'ios';
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();

  useEffect(() => {
    async function registerPushToken() {
      // Push tokens are not available on simulators/emulators.
      if (!Device.isDevice) return;

      // Android requires a notification channel before requesting permissions.
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) return;

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        const stored = await getPushToken();
        if (stored !== token) {
          await registerDeviceToken(token);
          await setPushToken(token);
        }
      } catch {
        // Non-fatal — network failure or device registration issue
      }
    }

    registerPushToken();

    // Handles Expo token rotation: re-register immediately when the token changes.
    const tokenSubscription = Notifications.addPushTokenListener(async ({ data: token }) => {
      const stored = await getPushToken();
      if (stored !== token) {
        await registerDeviceToken(token);
        await setPushToken(token);
      }
    });

    // Re-check on foreground to catch permission grants via Settings after prior denial.
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        registerPushToken();
      }
    });

    return () => {
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  // Deep-link to a quote when the user taps a push notification.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string | undefined>;
      const quoteId = data?.quote_id;
      if (quoteId) {
        router.push({ pathname: '/(app)/[quoteID]', params: { quoteID: quoteId } });
      }
    });

    // Handle the notification tap that cold-started (or re-opened) the app.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, string | undefined>;
      const quoteId = data?.quote_id;
      if (quoteId) {
        router.push({ pathname: '/(app)/[quoteID]', params: { quoteID: quoteId } });
      }
    });

    return () => subscription.remove();
  }, [router]);

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
        name="delete-account"
        options={{
          headerShown: true,
          headerTitle: 'Delete Account',
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
