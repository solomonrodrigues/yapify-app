import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { Quote } from '@/types/api';
import { useQuotes } from '@/context/QuotesContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';

// Individual Quote Component Props
interface FeedQuoteProps {
  quote: Quote;
  styles: ReturnType<typeof getStyles>;
  theme: any;
  onLike: (quoteId: number) => void;
  onWitness: (quoteId: number) => void;
}

// Individual Quote Component
const FeedQuote: React.FC<FeedQuoteProps> = ({ quote, styles, theme, onLike, onWitness }) => {
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
    <View style={styles.quoteCard}>
      <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.authorName}>
            {author.display_name}
          </Text>
          <Text style={styles.quotedText}>
            quoted {quoted_user?.display_name ?? quoted_name}
          </Text>
        </View>
      </View>

      {/* Quote Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.quoteContent}>
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
          <IconSymbol
            name="eye"
            color={theme.witnessButton}
            size={16}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.actionText, { color: theme.witnessButton }]}>
            {witness_count} witnesses
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
};

// Main Feed Component
const QuotesFeed: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { quotes, refreshing, refreshQuotes, likeQuoteById, witnessQuoteById } = useQuotes();

  // If no quotes at all (initial load or empty)
  if (!refreshing && quotes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          No quotes available
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refreshQuotes()}
        >
          <Text style={styles.retryText}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render quotes feed
  return (
    <ThemedView>
    <SafeAreaView style={styles.container}>
      <FlatList
        data={quotes}
        keyExtractor={(item: Quote) => item.id.toString()}
        renderItem={({ item }) => (
          <FeedQuote
            quote={item}
            styles={styles}
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
    </ThemedView>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      backgroundColor: theme.background,
    },
    quoteCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      backgroundColor: theme.cardBackground,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
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
      color: theme.text,
    },
    quotedText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.secondaryText,
    },
    contentContainer: {
      marginBottom: 16,
    },
    quoteContent: {
      fontSize: 16,
      lineHeight: 24,
      fontStyle: 'italic',
      color: theme.text,
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
  });

export default QuotesFeed;
