// app/_layout.tsx
import { AuthProvider } from '@/context/AuthContext';
import { QuoteActionsModalProvider } from '@/context/QuoteActionsModalContext';
import { QuotesProvider } from '@/context/QuotesContext';
import { UserProvider } from '@/context/UserContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Sansation: require('../assets/fonts/Sansation-Bold.ttf'),
  });

  if (!loaded) return null;

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <AuthProvider>
      <UserProvider>
        <QuotesProvider>
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
        </QuotesProvider>
      </UserProvider>
    </AuthProvider>
  );
}
