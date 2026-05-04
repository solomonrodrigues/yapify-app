import { LegendList } from "@legendapp/list";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useToast } from "@/context/ToastContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { Quote } from "@/types/api";

export interface QuoteListFeed {
  quotes: Quote[];
  initialLoading: boolean;
  refreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  loadMore: () => void;
  loadQuotes: () => Promise<void> | void;
  refreshQuotes: () => Promise<void> | void;
}

interface QuoteListScreenProps {
  feed: QuoteListFeed;
  renderItem: (quote: Quote) => React.ReactElement;
  loadingText: string;
  errorText: string;
  errorToastLabel: string;
  emptyText: string;
}

export const QuoteListScreen: React.FC<QuoteListScreenProps> = ({
  feed,
  renderItem,
  loadingText,
  errorText,
  errorToastLabel,
  emptyText,
}) => {
  const {
    quotes,
    initialLoading,
    refreshing,
    isLoadingMore,
    hasMore,
    hasLoadedOnce,
    error,
    loadMore,
    loadQuotes,
    refreshQuotes,
  } = feed;

  const styles = useThemedStyles(getStyles);
  const insets = useSafeAreaInsets();
  const { toast } = useToast();

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const prevErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== prevErrorRef.current && hasLoadedOnce) {
      toast.show({ variant: 'danger', label: errorToastLabel });
    }
    prevErrorRef.current = error;
  }, [error, hasLoadedOnce, errorToastLabel]);

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
        <ThemedText style={styles.loadingText}>{loadingText}</ThemedText>
      </ThemedView>
    );
  }

  if (!hasLoadedOnce && error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>{errorText}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadQuotes()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        <LegendList
          data={quotes}
          keyExtractor={(item: Quote) => item.id.toString()}
          renderItem={({ item }) => renderItem(item)}
          refreshing={refreshing}
          onRefresh={refreshQuotes}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedContainer,
            quotes.length === 0 && styles.emptyListContent,
          ]}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>{emptyText}</ThemedText>
            </View>
          }
        />
      </View>
    </ThemedView>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    feedContainer: {
      paddingBottom: 48,
      flexGrow: 1,
    },
    emptyListContent: {
      justifyContent: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    emptyText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
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
      fontWeight: '600',
      color: theme.accent,
    },
    loadingFooter: {
      padding: 20,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.secondaryText,
    },
  });
