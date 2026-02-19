// components/DataPreloader.tsx
import { useNotifications } from '@/context/NotificationsContext';
import { useQuotes } from '@/context/QuotesContext';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from './ThemedText';

const loadingMessages = [
  "Slaying goblins...",
  "Untangling Christmas lights...",
  "Launching rockets...",
  "Collecting garbage...",
  "Feeding the dogs...",
  "Picking berries..."
];

export function DataPreloader({ children }: { children: React.ReactNode }) {
  const { loadQuotes, initialLoading: quotesInitialLoading, hasLoadedOnce: quotesLoaded, error: quotesError } = useQuotes();
  const { loadUser, loading: userLoading, hasLoadedOnce: userLoaded, user } = useUser();
  const { fetchNotifications, hasLoadedOnce: notificationsLoaded } = useNotifications();
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    if (!quotesLoaded) {
      loadQuotes(false);
    }

    if (!userLoaded) {
      loadUser();
    }

    if (!notificationsLoaded) {
      fetchNotifications();
    }
  }, [quotesLoaded, userLoaded, notificationsLoaded, loadQuotes, loadUser, fetchNotifications]);

  // Handle loading message rotation
  useEffect(() => {
    const isInitiallyLoading = quotesInitialLoading || userLoading || (!user && !userLoaded);
    
    if (isInitiallyLoading) {
      const getRandomMessage = () => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setLoadingMessage(loadingMessages[randomIndex]);
      };
      
      getRandomMessage();
      const interval = setInterval(getRandomMessage, 3000);
      return () => clearInterval(interval);
    }
  }, [quotesInitialLoading, userLoading, userLoaded, user]);

  // Don't render children until we have essential data.
  // Exclude the error case — if quotes failed, pass through so the feed can show its own error UI.
  const showInitialLoading = (
    quotesInitialLoading ||                               // Still loading quotes initially
    userLoading ||                                        // Still loading user
    (!user && !userLoaded) ||                             // No user data and haven't finished loading attempt
    (!quotesLoaded && !quotesInitialLoading && !quotesError) // Haven't triggered load yet
  );

  if (showInitialLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ padding: 10 }}>{loadingMessage || 'Loading...'}</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ padding: 10 }}>Loading user data...</ThemedText>
      </ThemedView>
    );
  }

  return <>{children}</>;
}
