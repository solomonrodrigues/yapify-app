import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { useUser } from '@/context/UserContext';
import { LegendList } from '@legendapp/list';
import { useRouter } from 'expo-router';
import PillActionButton from '@/components/PillActionButton';


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
  const { user } = useUser();
  const router = useRouter();

  // Random but deterministic pastel for the background (based on ID)
  const pastelKeys = Object.keys(theme.pastels) as (keyof typeof theme.pastels)[];
  const index = Number(quote.id) % pastelKeys.length;
  const randomPastel = theme.pastels[pastelKeys[index]];
  const guessable = (!guessMade && quote.guess_options?.length > 1 && !(quote.author.id === user?.id));

  const handleGuess = (userId?: number, skipped?: boolean) => {
    onGuess(quote.id, userId, skipped);
    setGuessMade(true);
  };

  const openGuessModal = () => {
    if (!guessMade && quote.guess_options?.length) {
      setShowGuessModal(true);
    }
  };

  const navigateToProfile = (userId: number) => {
    router.push({
      pathname: "/user/[userID]",
      params: { userID: userId },
    });
  };

  return (
    <View style={[styles.quoteContainer, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateToProfile(quote.author.id)}>
          <Text style={styles.authorName}>{quote.author.display_name}</Text>
        </TouchableOpacity>
        <Text style={styles.quotedText}> quoted </Text>
        {guessable ? (
          <Text style={[styles.quotedText, styles.mysteryText]}>???</Text>
        ) : quote.quoted_user ? (
          <TouchableOpacity onPress={() => navigateToProfile(quote.quoted_user.id)}>
            <Text style={styles.quotedNameLink}>{quote.quoted_user.display_name}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.quotedNameLink}>{quote.quoted_name}</Text>
        )}
      </View>

      {/* Quote Content - Hero Element */}
      <View style={styles.contentContainer}>
        <Text style={styles.quoteContent}>&ldquo;{quote.text}&rdquo;</Text>
      </View>

      {/* Guess Result Badge */}
      {quote.has_guessed && (
        <View style={styles.guessResultContainer}>
          <View style={[
            styles.guessResultBadge,
            { 
              backgroundColor: quote.guess?.correct 
                ? theme.witnessButton + '15' 
                : quote.guess?.skipped 
                ? theme.secondaryText + '15'
                : theme.destructive + '15',
              borderColor: quote.guess?.correct 
                ? theme.witnessButton 
                : quote.guess?.skipped
                ? theme.secondaryText
                : theme.destructive
            }
          ]}>
            <IconSymbol
              name={quote.guess?.skipped ? 'forward.fill' : quote.guess?.correct ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
              color={quote.guess?.correct ? theme.witnessButton : quote.guess?.skipped ? theme.secondaryText : theme.destructive}
              size={14}
              style={{ marginRight: 6 }}
            />
            <Text style={[
              styles.guessResultText,
              { color: quote.guess?.correct ? theme.witnessButton : quote.guess?.skipped ? theme.secondaryText : theme.destructive }
            ]}>
              {quote.guess?.skipped
                ? 'Skipped'
                : quote.guess?.correct
                ? 'Correct!'
                : `Wrong · ${quote.quoted_user?.display_name ?? quote.quoted_name}`}
            </Text>
          </View>
        </View>
      )}

      {/* Actions Bar */}
      <View style={styles.actionsBar}>
        <PillActionButton
          icon={
            <IconSymbol
              name={quote.is_liked ? 'heart.fill' : 'heart'}
              color={quote.is_liked ? theme.likeButton : theme.secondaryText}
              size={18}
              style={{ marginRight: 6 }}
            />
          }
          label={quote.like_count}
          color={quote.is_liked ? theme.likeButton : theme.secondaryText}
          onPress={() => onLike(quote.id)}
          // highlighted={quote.is_liked}
          testID="like-button"
        />
        
        {guessable && (
          <PillActionButton
            icon={
              <IconSymbol
                name="person.fill.viewfinder"
                color={randomPastel}
                size={18}
                style={{ marginRight: 6 }}
              />
            }
            label="YapGuess"
            color={randomPastel}
            onPress={openGuessModal}
            highlighted={false}
            testID="guess-button"
          />
        )}

        {!guessable && (
          <PillActionButton
            icon={
              <IconSymbol
                name="eye"
                color={quote.is_witnessed ? theme.witnessButton : theme.secondaryText}
                size={18}
                style={{ marginRight: 6 }}
              />
            }
            label={quote.witness_count}
            color={quote.is_witnessed ? theme.witnessButton : theme.secondaryText}
            onPress={() => onWitness(quote.id)}
            // highlighted={quote.is_witnessed}
            testID="witness-button"
          />
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      <GuessGameModal
        quote={quote}
        visible={showGuessModal}
        onClose={() => setShowGuessModal(false)}
        onGuess={handleGuess}
        theme={theme}
      />
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
  const paddingTop = Platform.OS === 'ios' ? 0 : 16;

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
    guessResultContainer: {
      marginBottom: 16,
    },
    guessResultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      borderWidth: 1,
    },
    guessResultText: {
      fontSize: 13,
      fontWeight: '600',
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginTop: 10,
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