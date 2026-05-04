// app/(app)/_layout.tsx
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { registerDeviceToken } from "@/lib/api/devices";
import { getPushToken, setPushToken } from "@/lib/utils/storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Redirect, Stack, useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform, useColorScheme } from "react-native";
import { HeaderBackButton } from "@react-navigation/elements";

// `group_invite` routes to /notifications because the accept/reject UI lives
// there and the recipient hasn't joined the group yet.
function routeForNotification(data: Record<string, string | undefined> | undefined): Href | null {
  if (!data) return null;
  if (data.quote_id) {
    return { pathname: '/(app)/[quoteID]', params: { quoteID: data.quote_id } };
  }
  if (data.notification_type === 'group_invite_accepted' && data.group_id) {
    return { pathname: '/(app)/groups/[groupId]/members', params: { groupId: data.group_id } };
  }
  if (data.notification_type === 'group_invite') {
    return '/(app)/(tabs)/notifications';
  }
  return null;
}

export default function AppLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const isIOS = Platform.OS === 'ios';
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();

  useEffect(() => {
    // expo-notifications remote push APIs were removed from Expo Go on Android in SDK 53.
    // Skip all push setup when running in Expo Go on Android to avoid crashes.
    const isExpoGoAndroid = Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient';

    async function registerPushToken() {
      // Push tokens are not available on simulators/emulators or Expo Go on Android.
      if (!Device.isDevice || isExpoGoAndroid) return;

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

    // Handles native token rotation (APNs/FCM). The listener emits the raw device
    // token, not an Expo push token — re-run the full registration to exchange it.
    const tokenSubscription = isExpoGoAndroid ? null : Notifications.addPushTokenListener(() => {
      registerPushToken();
    });

    // Re-check on foreground to catch permission grants via Settings after prior denial.
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        registerPushToken();
      }
    });

    return () => {
      tokenSubscription?.remove();
      appStateSubscription.remove();
    };
  }, []);

  // Deep-link when the user taps a push notification (foreground listener
  // plus the cold-start / re-open case).
  useEffect(() => {
    const handle = (data: Record<string, string | undefined> | undefined) => {
      const target = routeForNotification(data);
      if (target) router.push(target);
    };

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handle(response.notification.request.content.data as Record<string, string | undefined>);
    });

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      handle(lastResponse.notification.request.content.data as Record<string, string | undefined>);
    }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(fallbackRoute as any);
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
        name="groups/create"
        options={{
          headerShown: true,
          headerTitle: 'New Group',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={handleBackPress('/(tabs)')}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="groups/[groupId]/settings"
        options={{
          headerShown: true,
          headerTitle: 'Group Settings',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={() => router.back()}
              tintColor={theme.text}
              label={"Back"}
            />
          ),
        }}
      />
      <Stack.Screen
        name="groups/[groupId]/members"
        options={{
          headerShown: true,
          headerTitle: 'Members',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={() => router.back()}
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
