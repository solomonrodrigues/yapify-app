import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import { Quote } from '@/types/api';
import { useQuotes } from '@/context/QuotesContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import GuessGameModal from '@/components/modals/GuessGameModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FeedQuoteProps {
  quote: Quote;
  styles: ReturnType<typeof getStyles>;
  theme: any;
  onLike: (quoteId: number) => void;
  onWitness: (quoteId: number) => void;
  onGuess: (quoteId: number, guessedUserId?: number, skipped?: boolean) => void;
}

const FeedQuote: React.FC<FeedQuoteProps> = ({
  quote,
  styles,
  theme,
  onLike,
  onWitness,
  onGuess,
}) => {
  const [guessMade, setGuessMade] = useState(!!quote.has_guessed);
  const [showGuessModal, setShowGuessModal] = useState(false);

  // Random but deterministic pastel for the background (based on ID)
  const pastelKeys = Object.keys(theme.pastels) as (keyof typeof theme.pastels)[];
  const index = Number(quote.id) % pastelKeys.length;
  const randomPastel = theme.pastels[pastelKeys[index]];

  const handleGuess = (userId?: number, skipped?: boolean) => {
    onGuess(quote.id, userId, skipped);
    setGuessMade(true);
  };

  const openGuessModal = () => {
    if (!guessMade && quote.guess_options?.length) {
      setShowGuessModal(true);
    }
  };

  // If not guessed yet, show as a big mysterious button
  if (!guessMade && quote.guess_options?.length > 1) {
    return (
      <>
        <TouchableOpacity 
          style={[styles.mysteryCard, { backgroundColor: randomPastel }]}
          onPress={openGuessModal}
          activeOpacity={0.85}
        >
          <View style={styles.mysteryContent}>
            <IconSymbol 
              name="questionmark.circle.fill" 
              size={64} 
              color="rgba(0,0,0,0.2)" 
              style={styles.mysteryIcon}
            />
            <Text style={styles.mysteryQuote} numberOfLines={4}>
              &ldquo;{quote.text}&rdquo;
            </Text>
          </View>
        </TouchableOpacity>

        <GuessGameModal
          quote={quote}
          visible={showGuessModal}
          onClose={() => setShowGuessModal(false)}
          onGuess={handleGuess}
          theme={theme}
        />
      </>
    );
  }

  // If guessed or no options, show normal card
  return (
    <View style={[styles.quoteCard, { backgroundColor: theme.cardBackground }]}>
      <View>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.authorName}>{quote.author.display_name}</Text>
            <Text style={styles.quotedText}>
              quoted {quote.quoted_user?.display_name ?? quote.quoted_name}
            </Text>
          </View>
        </View>

        {/* Quote Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.quoteContent}>&ldquo;{quote.text}&rdquo;</Text>
        </View>

        {/* Guess Result */}
        {quote.has_guessed && (
          <View style={styles.guessResult}>
            <Text style={{ color: quote.guess?.correct ? theme.witnessButton : theme.destructive }}>
              {quote.guess?.skipped
                ? 'Skipped'
                : quote.guess?.correct
                ? `Correct!`
                : `Wrong! It was ${quote.quoted_user?.display_name ?? quote.quoted_name}`}
            </Text>
          </View>
        )}

        {/* Actions Bar */}
        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onLike(quote.id)}>
            <IconSymbol
              name={quote.is_liked ? 'heart.fill' : 'heart'}
              color={quote.is_liked ? theme.likeButton : theme.secondaryText}
              size={16}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.actionText,
                { color: quote.is_liked ? theme.likeButton : theme.secondaryText, fontWeight: quote.is_liked ? '600' : '400' },
              ]}
            >
              {quote.like_count}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onWitness(quote.id)}>
            <IconSymbol
              name="eye"
              color={theme.witnessButton}
              size={16}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.actionText, { color: theme.witnessButton }]}>
              {quote.witness_count} witnesses
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
  const { quotes, refreshing, refreshQuotes, likeQuoteById, witnessQuoteById, guessQuoteById } = useQuotes();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? 0 : 16;  // extra padding for android

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
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
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
              onGuess={guessQuoteById}
            />
          )}
          refreshing={refreshing}
          onRefresh={refreshQuotes}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContainer}
          style={{ paddingTop: paddingTop }}
        />
      </View>
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
    // Mystery card styles for unguessed quotes
    mysteryCard: {
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      overflow: 'hidden',
    },
    mysteryContent: {
      padding: 24,
      alignItems: 'center',
    },
    mysteryIcon: {
      marginBottom: 8,
    },
    mysteryQuote: {
      fontSize: 16,
      fontStyle: 'italic',
      color: 'rgba(0,0,0,0.7)',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    // Regular card styles for guessed quotes
    quoteCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
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
    guessResult: { 
      marginBottom: 12 
    },
  });

export default QuotesFeed;
