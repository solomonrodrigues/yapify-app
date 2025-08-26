import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { Quote } from '@/types/api';
import { useQuotes } from '@/context/QuotesContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

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
    author,
    quoted_user,
    quoted_name,
    witness_count,
    like_count,
    is_liked,
  } = quote;

  return (
    <View style={[styles.quoteCard, {
      backgroundColor: theme.cardBackground,
      borderColor: theme.border
    }]}>
      <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: theme.primaryText }]}>
            {author.display_name}
          </Text>
          <Text style={[styles.quotedText, { color: theme.secondaryText }]}>
            quoted {quoted_user?.display_name ?? quoted_name}
          </Text>
        </View>
      </View>

      {/* Quote Content */}
      <View style={styles.contentContainer}>
        <Text style={[styles.quoteContent, { color: theme.primaryText }]}>
          &quot;{text}&quot;
        </Text>
      </View>

      {/* Actions Bar */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(id)}
        >
          <IconSymbol 
            name={is_liked ? 'heart.fill' : 'heart'}
            color={is_liked ? theme.likeButton : theme.secondaryText}
            size={16}
            style={{ marginRight: 6 }}
          />
          <Text style={[
            styles.actionText,
            {
              color: is_liked ? theme.likeButton : theme.secondaryText,
              fontWeight: is_liked ? '600' : '400'
            }
          ]}>{like_count}</Text>
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
    </View>
  );
};

// Main Feed Component
const QuotesFeed: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme: Theme = themes[colorScheme];

  const { quotes, refreshing, refreshQuotes, likeQuoteById, witnessQuoteById } = useQuotes();

  // If no quotes at all (initial load or empty)
  if (!refreshing && quotes.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
          No quotes available
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: theme.accent }]}
          onPress={() => refreshQuotes()}
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={quotes}
        keyExtractor={(item: Quote) => item.id.toString()}
        renderItem={({ item }) => (
          <FeedQuote
            quote={item}
            theme={theme}
            onLike={likeQuoteById}
            onWitness={witnessQuoteById}
          />
        )}
        refreshing={refreshing}
        onRefresh={() => refreshQuotes()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedContainer: {
    padding: 16,
    paddingBottom: 48,
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
