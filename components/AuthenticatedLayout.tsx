// app/(drawer)/BaseLayout.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, useColorScheme, Text } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useQuotes } from "@/context/QuotesContext";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, isLoggedIn } = useAuth();
  const { loading: userLoading } = useUser();
  const { initialLoading: quotesInitialLoading } = useQuotes();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme]

  // If not logged in, redirect to /auth
  useEffect(() => {
    if (!authLoading && !userLoading && !isLoggedIn) {
      setRedirecting(true);
      router.replace("/auth");
    }
  }, [authLoading, userLoading, isLoggedIn]);

  // Show loading until auth + user finish
  if (authLoading || userLoading || quotesInitialLoading || redirecting || !isLoggedIn) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={{ padding: 10, color: theme.text }}>Slaying goblins...</Text>
      </ThemedView>
    );
  }

  return <>{children}</>;
}
