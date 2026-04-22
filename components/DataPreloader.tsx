// components/DataPreloader.tsx
import { useNotifications } from '@/context/NotificationsContext';
import { useQuotes } from '@/context/QuotesContext';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
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
  const { loadUser, loading: userLoading, hasLoadedOnce: userLoaded, user, error: userError } = useUser();
  const { fetchNotifications, hasLoadedOnce: notificationsLoaded } = useNotifications();
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    loadQuotes(false);
    loadUser();
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // Exclude error cases — screens handle their own error UI.
  const showInitialLoading = (
    quotesInitialLoading ||                                    // Still loading quotes initially
    userLoading ||                                             // Still loading user
    (!user && !userLoaded && !userError) ||                    // User load in-flight or not yet triggered
    (!quotesLoaded && !quotesInitialLoading && !quotesError)   // Quotes load in-flight or not yet triggered
  );

  if (showInitialLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ padding: 10 }}>{loadingMessage || 'Loading...'}</ThemedText>
      </ThemedView>
    );
  }

  // Children need a valid user — if user load failed, surface a retry rather than crashing
  if (!user) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {userError ? (
          <>
            <ThemedText style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
              {"Couldn't load your profile"}
            </ThemedText>
            <TouchableOpacity
              onPress={loadUser}
              style={{ borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, borderColor: '#888' }}
            >
              <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>Retry</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <ActivityIndicator size="large" />
        )}
      </ThemedView>
    );
  }

  return <>{children}</>;
}
