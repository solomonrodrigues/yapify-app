// components/DataPreloader.tsx
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
  const { loadQuotes, initialLoading: quotesInitialLoading, hasLoadedOnce: quotesLoaded } = useQuotes();
  const { loadUser, loading: userLoading, hasLoadedOnce: userLoaded, user } = useUser(); // Get user object
  const [loadingMessage, setLoadingMessage] = useState('');

  // Preload data immediately
  useEffect(() => {
    console.log('Preloading data for authenticated user...');
    
    if (!quotesLoaded) {
      console.log('Loading quotes...');
      loadQuotes(false);
    }
    
    if (!userLoaded) {
      console.log('Loading user...');
      loadUser();
    }
  }, [quotesLoaded, userLoaded, loadQuotes, loadUser]);

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

  // CRITICAL: Don't render children until we have essential data
  const showInitialLoading = (
    quotesInitialLoading ||           // Still loading quotes initially
    userLoading ||                    // Still loading user
    (!user && !userLoaded) ||         // No user data and haven't finished loading attempt
    (!quotesLoaded && !quotesInitialLoading) // Haven't started loading quotes yet
  );
  
  console.log('Loading decision:', { showInitialLoading, hasUser: !!user });
  
  if (showInitialLoading) {
    console.log('Blocking render - showing loading screen');
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ padding: 10 }}>{loadingMessage || 'Loading...'}</ThemedText>
      </ThemedView>
    );
  }

  // Additional safety check - if somehow we get here without user data, show loading
  if (!user) {
    console.warn('No user data available, showing loading screen');
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ padding: 10 }}>Loading user data...</ThemedText>
      </ThemedView>
    );
  }

  console.log('Rendering children - all data loaded');
  return <>{children}</>;
}
