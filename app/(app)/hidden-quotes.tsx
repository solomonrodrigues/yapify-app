// app/(app)/hidden-quotes.tsx
import { LegendList } from "@legendapp/list";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import HiddenQuote from "@/components/HiddenQuote";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useHiddenQuotesFeed } from "@/hooks/useHiddenQuotesFeed";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { Quote } from "@/types/api";

const HiddenQuotesScreen = () => {
  const {
    quotes,
    initialLoading,
    refreshing,
    isLoadingMore,
    hasMore,
    hasLoadedOnce,
    loadMore,
    loadQuotes,
    refreshQuotes,
    unhideQuoteById,
    error,
  } = useHiddenQuotesFeed();

  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Kick off the first load when the screen mounts
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Show toast for errors that occur after initial load (refresh/loadMore failures)
  const prevErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== prevErrorRef.current && hasLoadedOnce) {
      Toast.show({ type: "error", text1: "Couldn't load hidden quotes" });
    }
    prevErrorRef.current = error;
  }, [error, hasLoadedOnce]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" />
        <ThemedText style={styles.loadingText}>Loading more...</ThemedText>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  if (initialLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading hidden quotes...</ThemedText>
      </ThemedView>
    );
  }

  // Failed to load on first attempt — show error with retry
  if (!hasLoadedOnce && error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>Couldn't load hidden quotes</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadQuotes()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <View
        style={{
          flex: 1,
          paddingBottom: insets.bottom,
        }}
      >
        <LegendList
          data={quotes}
          keyExtractor={(item: Quote) => item.id.toString()}
          renderItem={({ item }) => (
            <HiddenQuote quote={item} theme={theme} onUnhide={unhideQuoteById} />
          )}
          refreshing={refreshing}
          onRefresh={refreshQuotes}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedContainer,
            quotes.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                You don&apos;t have any hidden quotes
              </ThemedText>
            </View>
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      </View>
    </ThemedView>
  );
};

export default HiddenQuotesScreen;

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    feedContainer: {
      paddingBottom: 20,
      flexGrow: 1,
    },
    emptyListContent: {
      justifyContent: "center",
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: theme.background,
    },
    emptyText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: "center",
      color: theme.secondaryText,
    },
    retryButton: {
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderColor: theme.accent,
    },
    retryText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.accent,
    },
    loadingFooter: {
      padding: 20,
      alignItems: "center",
    },
    loadingText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.secondaryText,
    },
  });

