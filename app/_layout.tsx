// app/_layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UpdateRequiredScreen } from '@/components/UpdateRequiredScreen';
import { AuthProvider } from '@/context/AuthContext';
import { BlockedUsersProvider } from '@/context/BlockedUsersContext';
import { FeedFilterProvider } from '@/context/FeedFilterContext';
import { FriendsProvider } from '@/context/FriendsContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { QuoteActionsModalProvider } from '@/context/QuoteActionsModalContext';
import { QuotesProvider } from '@/context/QuotesContext';
import { UserProvider } from '@/context/UserContext';
import { deregisterDeviceToken } from '@/lib/api/devices';
import { getAppConfig } from '@/lib/api/config';
import { setOnUpdateRequiredHandler, UpdateRequiredPayload } from '@/lib/api/client';
import { getPendingDeregistrations, removePendingDeregistrations } from '@/lib/utils/storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from "react-native-toast-message";

function isVersionBelow(current: string, minimum: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [cMaj, cMin, cPat] = parse(current);
  const [mMaj, mMin, mPat] = parse(minimum);
  if (cMaj !== mMaj) return cMaj < mMaj;
  if (cMin !== mMin) return cMin < mMin;
  return cPat < mPat;
}

function pickStoreUrl(data: UpdateRequiredPayload): string {
  return Platform.OS === 'ios' ? (data.ios_store_url ?? '') : (data.android_store_url ?? '');
}

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Sansation: require('../assets/fonts/Sansation-Bold.ttf'),
    Lora: require('../assets/fonts/Lora-Regular.ttf'),
    'Lora-Bold': require('../assets/fonts/Lora-Bold.ttf'),
  });

  const [updateRequired, setUpdateRequired] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');

  // Drain any push tokens that failed to deregister on a previous logout (e.g. no network).
  // Runs on every cold start before auth is checked. Uses the unauthenticated DELETE path,
  // so no session is needed. Tokens that still fail are left in the queue for the next start.
  useEffect(() => {
    async function drainPendingDeregistrations() {
      const pending = await getPendingDeregistrations();
      if (pending.length === 0) return;

      const succeeded: string[] = [];
      await Promise.allSettled(
        pending.map(async (token) => {
          try {
            await deregisterDeviceToken(token);
            succeeded.push(token);
          } catch {
            // Still no network — leave in queue
          }
        })
      );

      if (succeeded.length > 0) {
        await removePendingDeregistrations(succeeded);
      }
    }

    drainPendingDeregistrations();
  }, []);

  // Register 426 interceptor handler
  useEffect(() => {
    setOnUpdateRequiredHandler((data?: UpdateRequiredPayload) => {
      setStoreUrl(data ? pickStoreUrl(data) : '');
      setUpdateRequired(true);
    });
  }, []);

  // Startup version check
  useEffect(() => {
    getAppConfig()
      .then((config) => {
        const current = Constants.expoConfig?.version ?? '0.0.0';
        if (isVersionBelow(current, config.minimum_version)) {
          setStoreUrl(pickStoreUrl(config));
          setUpdateRequired(true);
        }
      })
      .catch(() => {}); // network failure — let app proceed normally
  }, []);

  if (!loaded) return null;

  if (updateRequired) {
    return <UpdateRequiredScreen storeUrl={storeUrl} />;
  }

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ErrorBoundary>
    <AuthProvider>
      <UserProvider>
        <BlockedUsersProvider>
          <FeedFilterProvider>
            <QuotesProvider>
              <NotificationsProvider>
              <FriendsProvider>
              <QuoteActionsModalProvider>
              <ThemeProvider value={theme}>
                <GestureHandlerRootView>
                  <SafeAreaProvider>
                    <KeyboardProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: 'none',
                        }}
                      >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(app)" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      <Toast />
                      <StatusBar style="auto" />
                    </KeyboardProvider>
                  </SafeAreaProvider>
                </GestureHandlerRootView>
              </ThemeProvider>
              </QuoteActionsModalProvider>
              </FriendsProvider>
              </NotificationsProvider>
            </QuotesProvider>
          </FeedFilterProvider>
        </BlockedUsersProvider>
      </UserProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
