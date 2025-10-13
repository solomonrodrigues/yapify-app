import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from 'react-native';
import { QuotesProvider } from '@/context/QuotesContext';
import { useEffect } from 'react';
import { useRouter, useSegments, Stack } from 'expo-router';
import { UserProvider } from '@/context/UserContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { migrate } from '@/lib/db/migrate';

function RootLayoutNav() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth check to complete

    const inAuthGroup = segments[0] === 'auth';

    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to auth if not logged in and not already in auth
      console.log('Redirecting to auth - not logged in');
      router.replace('/auth');
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect to main app if logged in but still in auth
      console.log('Redirecting to main app - logged in');
      router.replace('/(app)/(tabs)');
    }
  }, [isLoggedIn, isLoading, segments, router]);

  if (isLoggedIn) {
    return (
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/email-verification" options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }} />
        <Stack.Screen name="auth/reset-password" options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    );
  } else {
    return (
      <Stack>
        <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/email-verification" options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }} />
        <Stack.Screen name="auth/reset-password" options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    );
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Sansation: require('../assets/fonts/Sansation-Bold.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      {/* Pass props into Providers */}
      <Providers
        theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      />
    </AuthProvider>
  );
}


function Providers({ theme }: { theme: any }) {
  return (
    <UserProvider>
      <QuotesProvider>
        <ThemeProvider value={theme}>
          <SafeAreaProvider>
            <KeyboardProvider>
              <SQLiteProvider databaseName="app.db" onInit={migrate}>
                <RootLayoutNav />
                <StatusBar style="auto" />
              </SQLiteProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QuotesProvider>
    </UserProvider>
  );
}
