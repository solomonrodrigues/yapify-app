import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getQuotes, likeQuote, witnessQuote } from '@/api/quotes';
import { Quote } from '@/types/api';

// Theme types
interface Theme {
  background: string;
  cardBackground: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  border: string;
  likeButton: string;
  witnessButton: string;
}

// Theme colors
const themes: { light: Theme; dark: Theme } = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#F8F9FA',
    primaryText: '#1A1A1A',
    secondaryText: '#6B7280',
    accent: '#3B82F6',
    border: '#E5E7EB',
    likeButton: '#EF4444',
    witnessButton: '#10B981',
  },
  dark: {
    background: '#000000',
    cardBackground: '#1F2937',
    primaryText: '#FFFFFF',
    secondaryText: '#9CA3AF',
    accent: '#60A5FA',
    border: '#374151',
    likeButton: '#F87171',
    witnessButton: '#34D399',
  },
};

// Individual Quote Component Props
interface FeedQuoteProps {
  quote: Quote;
  theme: Theme;
  onLike: (quoteId: number) => void;
  onWitness: (quoteId: number) => void;
}

// Individual Quote Component
const FeedQuote: React.FC<FeedQuoteProps> = ({ quote, theme, onLike, onWitness }) => {
  const {
    id,
    text,
    author_name,
    quoted_user_name,
    witness_count,
    like_count,
    is_liked,
    // created_at,
  } = quote;

  // const formatDate = (dateString: string): string => {
  //   const date = new Date(dateString);
  //   const now = new Date();
  //   const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  //   if (diffInHours < 24) {
  //     return `${diffInHours}h ago`;
  //   } else {
  //     const diffInDays = Math.floor(diffInHours / 24);
  //     return `${diffInDays}d ago`;
  //   }
  // };

  return (
    <View style={[styles.quoteCard, {
      backgroundColor: theme.cardBackground,
      borderColor: theme.border
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: theme.primaryText }]}>
            {author_name}
          </Text>
          <Text style={[styles.quotedText, { color: theme.secondaryText }]}>
            quoted {quoted_user_name}
          </Text>
        </View>
        {/* <Text style={[styles.timestamp, { color: theme.secondaryText }]}>
          {formatDate(created_at)}
        </Text> */}
      </View>

      {/* Quote Content */}
      <View style={styles.contentContainer}>
        <Text style={[styles.quoteContent, { color: theme.primaryText }]}>
          "{text}"
        </Text>
      </View>

      {/* Actions Bar */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(id)}
        >
          <Text style={[
            styles.actionText,
            {
              color: is_liked ? theme.likeButton : theme.secondaryText,
              fontWeight: is_liked ? '600' : '400'
            }
          ]}>
            ♥ {like_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onWitness(id)}
        >
          <Text style={[styles.actionText, { color: theme.witnessButton }]}>
            👁 {witness_count} witnesses
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Feed Component
const QuotesFeed: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme: Theme = themes[colorScheme || 'light'] || themes.light;

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch quotes from API
  const fetchQuotes = async (showRefreshIndicator: boolean = false): Promise<void> => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      const data = await getQuotes();
      setQuotes(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      Alert.alert(
        'Error',
        'Failed to load quotes. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle like action
  const handleLike = async (quoteId: number): Promise<void> => {
    try {
      // Optimistic update
      setQuotes(prevQuotes =>
        prevQuotes.map(quote => {
          if (quote.id === quoteId) {
            return {
              ...quote,
              is_liked: !quote.is_liked,
              like_count: quote.is_liked ? quote.like_count - 1 : quote.like_count + 1
            };
          }
          return quote;
        })
      );

      // Make API call
      await likeQuote(quoteId);
    } catch (error) {
      console.error('Error liking quote:', error);
      // Revert optimistic update on error
      setQuotes(prevQuotes =>
        prevQuotes.map(quote => {
          if (quote.id === quoteId) {
            return {
              ...quote,
              is_liked: !quote.is_liked,
              like_count: quote.is_liked ? quote.like_count + 1 : quote.like_count - 1
            };
          }
          return quote;
        })
      );
    }
  };

  // Handle witness action
  const handleWitness = async (quoteId: number): Promise<void> => {
    try {
      // For now, we'll default to witnessing (true) with no comment
      // You might want to show a modal for comment input in the future
      await witnessQuote(quoteId, true, '');

      // Refresh the quotes to get updated witness count
      fetchQuotes();
    } catch (error) {
      console.error('Error witnessing quote:', error);
      Alert.alert('Error', 'Failed to witness quote. Please try again.');
    }
  };

  // Load quotes on component mount
  useEffect(() => {
    fetchQuotes();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
          Loading quotes...
        </Text>
      </View>
    );
  }

  // Render empty state
  if (quotes.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
          No quotes available
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: theme.accent }]}
          onPress={() => fetchQuotes()}
        >
          <Text style={[styles.retryText, { color: theme.accent }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render quotes feed
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={quotes}
        keyExtractor={(item: Quote) => item.id.toString()}
        renderItem={({ item }) => (
          <FeedQuote
            quote={item}
            theme={theme}
            onLike={handleLike}
            onWitness={handleWitness}
          />
        )}
        refreshing={refreshing}
        onRefresh={() => fetchQuotes(true)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quoteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  quotedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 8,
  },
  contentContainer: {
    marginBottom: 16,
  },
  quoteContent: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuotesFeed;
