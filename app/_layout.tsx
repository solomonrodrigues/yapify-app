import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from 'react-native';
import { QuotesProvider } from '@/context/QuotesContext';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
        <QuotesProvider>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/index" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        </QuotesProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
