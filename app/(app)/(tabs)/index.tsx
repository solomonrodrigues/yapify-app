import React from 'react';
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


// Main Feed Component
const QuotesFeed: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { quotes, refreshing, isLoadingMore, hasMore, refreshQuotes, loadMore, likeQuoteById, witnessQuoteById, guessQuoteById } = useQuotes();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? 0 : 16;

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

  if (!refreshing && quotes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No quotes available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshQuotes}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemedView>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <LegendList
          data={quotes}
          keyExtractor={(item: Quote) => item.id.toString()}
          renderItem={({ item }) => (
            <FeedQuote
              quote={item}
              styles={styles}
              theme={theme}
              onLike={likeQuoteById}
              onWitness={witnessQuoteById}
              onGuess={guessQuoteById}
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
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
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
    quoteContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    authorName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    quotedText: {
      fontSize: 14,
      color: theme.secondaryText,
      flexDirection: 'row',
      alignItems: 'center',
    },
    quotedNameLink: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    mysteryText: {
      fontWeight: '600',
      fontStyle: 'italic',
    },
    contentContainer: {
      marginBottom: 20,
      paddingVertical: 8,
    },
    quoteContent: {
      fontSize: 26,
      lineHeight: 34,
      color: theme.text,
      fontWeight: '300',
      letterSpacing: 0.3,
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
    },
    divider: {
      height: 1,
      backgroundColor: theme.divider,
      marginTop: 10,
      marginHorizontal: -16,
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
