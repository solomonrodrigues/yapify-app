// app/(app)/saved-quotes.tsx
import { LegendList } from "@legendapp/list";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FeedQuote from "@/components/FeedQuote";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useSavedQuotesFeed } from "@/hooks/useSavedQuotesFeed";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { Quote } from "@/types/api";

const SavedQuotesScreen = () => {
  const {
    quotes,
    initialLoading,
    refreshing,
    isLoadingMore,
    hasMore,
    loadMore,
    loadQuotes,
    refreshQuotes,
    likeQuoteById,
    witnessQuoteById,
    guessQuoteById,
    unsaveQuoteById,
    unhideQuoteById,
    error,
  } = useSavedQuotesFeed();

  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Kick off the first load when the screen mounts
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);


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
        <ThemedText style={styles.loadingText}>
          {error ? "Unable to load saved quotes" : "Loading saved quotes..."}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!refreshing && quotes.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>No saved quotes yet</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={refreshQuotes}>
          <Text style={styles.retryText}>Refresh</Text>
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
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <LegendList
          data={quotes}
          keyExtractor={(item: Quote) => item.id.toString()}
          renderItem={({ item }) => (
            <FeedQuote
              quote={item}
              theme={theme}
              onLike={likeQuoteById}
              onWitness={witnessQuoteById}
              onGuess={guessQuoteById}
              onUnsave={unsaveQuoteById}
              onUnhide={unhideQuoteById}
            />
          )}
          refreshing={refreshing}
          onRefresh={refreshQuotes}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      </View>
    </ThemedView>
  );
};

export default SavedQuotesScreen;

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    feedContainer: {
      paddingBottom: 48,
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
    errorText: {
      paddingHorizontal: 16,
      paddingTop: 12,
      color: theme.destructive,
    },
  });

