import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Quote } from '@/types/api';
import { useQuotes } from '@/context/QuotesContext';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegendList } from '@legendapp/list';
import FeedQuote from '@/components/FeedQuote';
import { useFeedFilter } from '@/context/FeedFilterContext';
import { useUser } from '@/context/UserContext';
import { IconSymbol } from '@/components/ui/IconSymbol';


// Main Feed Component
const QuotesFeed: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { quotes, refreshing, isLoadingMore, hasMore, refreshQuotes, loadMore, likeQuoteById, witnessQuoteById, guessQuoteById, saveQuoteById, unsaveQuoteById, unhideQuoteById, respondToQuoteById } = useQuotes();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? 0 : 16;
  const { filter } = useFeedFilter();
  const { user } = useUser();

  // Filter quotes based on selected filter
  const filteredQuotes = useMemo(() => {
    switch (filter) {
      case 'guessable':
        // Quotes that can be guessed but haven't been guessed yet
        return quotes.filter(
          (q) =>
            !q.has_guessed &&
            q.guess_options &&
            q.guess_options.length > 1 &&
            q.author.id !== user?.id
        );
      case 'respondable':
        // Quotes that can be responded to but haven't been responded yet
        return quotes.filter(
          (q) => q.can_respond && !q.quoted_user_response
        );
      case 'latest':
      default:
        return quotes;
    }
  }, [quotes, filter, user?.id]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  // Empty state messages based on filter
  const getEmptyMessage = () => {
    switch (filter) {
      case 'guessable':
        return "No quotes to guess right now";
      case 'respondable':
        return "No quotes to respond to";
      default:
        return "No quotes available";
    }
  };

  const getEmptyIcon = () => {
    switch (filter) {
      case 'guessable':
        return 'person.fill.viewfinder';
      case 'respondable':
        return 'bubble.left.fill';
      default:
        return 'quote.bubble';
    }
  };

  if (!refreshing && filteredQuotes.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <IconSymbol
          name={getEmptyIcon() as any}
          size={48}
          color={theme.secondaryText}
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
        {filter === 'latest' && (
          <TouchableOpacity style={styles.retryButton} onPress={refreshQuotes}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
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
          data={filteredQuotes}
          keyExtractor={(item: Quote) => item.id.toString()}
          renderItem={({ item }) => (
            <FeedQuote
              quote={item}
              theme={theme}
              onLike={likeQuoteById}
              onWitness={witnessQuoteById}
              onGuess={guessQuoteById}
              onSave={saveQuoteById}
              onUnsave={unsaveQuoteById}
              onUnhide={unhideQuoteById}
              onRespond={respondToQuoteById}
            />
          )}
          refreshing={refreshing}
          onRefresh={refreshQuotes}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          style={{ paddingTop: paddingTop }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      </View>
    </ThemedView>
  );
};

export const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    feedContainer: {
      paddingBottom: 48,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    contentContainer: {
      marginBottom: 20,
      paddingVertical: 8,
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
  }
);

export default QuotesFeed;
