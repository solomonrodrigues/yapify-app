// app/(drawer)/BaseLayout.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, useColorScheme, Text } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useQuotes } from "@/context/QuotesContext";

const loadingMessages = [
  "Slaying goblins...",
  "Untangling Christmas lights...",
  "Launching rocket...",
  "Collecting garbage..."
];

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, isLoggedIn } = useAuth();
  const { loading: userLoading } = useUser();
  const { initialLoading: quotesInitialLoading } = useQuotes();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const isLoading = authLoading || userLoading || quotesInitialLoading || redirecting || !isLoggedIn;

  // Handle loading message cycling - only when actually loading
  useEffect(() => {
    if (isLoading) {
      // Pick initial random message
      const getRandomMessage = () => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setLoadingMessage(loadingMessages[randomIndex]);
      };
      
      getRandomMessage(); // Set initial message
      
      // Change message every 3 seconds while loading
      const interval = setInterval(getRandomMessage, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // If not logged in, redirect to /auth
  useEffect(() => {
    if (!authLoading && !userLoading && !isLoggedIn) {
      setRedirecting(true);
      router.replace("/auth");
    }
  }, [authLoading, userLoading, isLoggedIn, router]);

  // Show loading until auth + user finish
  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={{ padding: 10, color: theme.text }}>{loadingMessage}</Text>
      </ThemedView>
    );
  }

  return <>{children}</>;
}
