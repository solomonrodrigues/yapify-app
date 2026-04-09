import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
  Share,
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
import { IconSymbol, type IconSymbolName } from '@/components/ui/IconSymbol';
import { useUser } from '@/context/UserContext';


// Main Feed Component
const QuotesFeed: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { quotes, refreshing, isLoadingMore, hasMore, error, hasLoadedOnce, refreshQuotes, loadMore, likeQuoteById, witnessQuoteById, guessQuoteById, saveQuoteById, unsaveQuoteById, unhideQuoteById, respondToQuoteById } = useQuotes();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? 0 : 16;
  const { filter } = useFeedFilter();
  const { user } = useUser();

  const handleInvite = async () => {
    if (!user?.username) return;
    await Share.share({
      message: `Join me on Yapify!\nhttps://yapify.net/invite/${user.username}/`,
    });
  };

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
        return "All caught up on guesses!\nCheck back when friends post more.";
      case 'respondable':
        return "Nothing waiting for your response.";
      default:
        return "Add friends and start sharing your group's funniest moments.";
    }
  };

  const getEmptyIcon = (): IconSymbolName => {
    switch (filter) {
      case 'guessable':
        return 'person.fill.viewfinder';
      case 'respondable':
        return 'bubble.left.fill';
      default:
        return 'quote.bubble';
    }
  };

  if (!hasLoadedOnce && error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Text style={styles.emptyText}>{"Couldn't load quotes"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshQuotes}>
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
          // On Android the tab bar is not absolutely positioned, so the content
          // area already ends at the top of the tab bar — no bottom padding needed.
          // On iOS the tab bar floats over content, so pad by the home-indicator height.
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
        }}
      >
        <LegendList
          data={quotes}
          keyExtractor={(item: Quote) => item.id.toString()}
          renderItem={({ item, index }) => (
            <FeedQuote
              quote={item}
              theme={theme}
              index={index}
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
          contentContainerStyle={[styles.feedContainer, quotes.length === 0 && styles.emptyListContent]}
          style={{ paddingTop: paddingTop }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol
                name={getEmptyIcon()}
                size={48}
                color={theme.secondaryText}
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
              {filter === 'latest' && (
                <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
                  <IconSymbol name="person.badge.plus" size={16} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={styles.inviteText}>Invite Friends</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </ThemedView>
  );
};

export const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
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
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderColor: theme.accent,
    },
    inviteText: {
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
