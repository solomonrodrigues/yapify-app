import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Quote } from '@/types/api';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import GuessGameModal from '@/components/modals/GuessGameModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';
import { getQuote, likeQuote, witnessQuote, guessQuote } from '@/lib/api/quotes';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import ActionChip from '@/components/ActionChip';

const QuoteDetail: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const navigation = useNavigation();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guessMade, setGuessMade] = useState(false);
  const [showGuessModal, setShowGuessModal] = useState(false);

  const params = useLocalSearchParams();
  const { quoteID } = params;

  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getQuote(Number(quoteID));
      setQuote(data);
      setGuessMade(!!data.has_guessed);
    } catch (err) {
      setError('Failed to load quote');
      console.error('Error fetching quote:', err);
    } finally {
      setLoading(false);
    }
  }, [quoteID]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote, quoteID]);

  const handleLike = async () => {
    if (!quote) return;
    try {
      // ToDo: Implement optimistic UI update + rollback on fail here
      await likeQuote(quote.id);
      setQuote({
        ...quote,
        is_liked: !quote.is_liked,
        like_count: quote.is_liked ? quote.like_count - 1 : quote.like_count + 1,
      });
    } catch (err) {
      console.error('Error liking quote:', err);
    }
  };

  const handleWitness = async () => {
    if (!quote) return;
    try {
      // ToDo: Implement optimistic UI update + rollback on fail here
      await witnessQuote(quote.id);
      setQuote({
        ...quote,
        is_witnessed: !quote.is_witnessed,
        witness_count: quote.is_witnessed ? quote.witness_count - 1 : quote.witness_count + 1,
      });
    } catch (err) {
      console.error('Error witnessing quote:', err);
    }
  };

  const handleGuess = async (userId?: number, skipped?: boolean) => {
    if (!quote) return;
    try {
      const result = await guessQuote(quote.id, userId, skipped);
      setGuessMade(true);
      setQuote({
        ...quote,
        has_guessed: true,
        guess: {
          id: result.id,
          user: result.user,
          quote: result.quote,
          guessed_user: result.guessed_user ?? null,
          correct: result.correct,
          skipped: result.skipped,
          created_at: result.created_at,
        },
      });
    } catch (err) {
      console.error('Error submitting guess:', err);
    }
  };

  const openGuessModal = () => {
    if (quote && !guessMade && quote.guess_options?.length) {
      setShowGuessModal(true);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </ThemedView>
    );
  }

  if (error || !quote) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Quote not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuote}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Random but deterministic pastel for the background (based on ID)
  const pastelKeys = Object.keys(theme.pastels) as (keyof typeof theme.pastels)[];
  const index = Number(quote.id) % pastelKeys.length;
  const randomPastel = theme.pastels[pastelKeys[index]];
  const guessable = (!guessMade && quote.guess_options?.length > 1 && !(quote.author.id === user?.id));

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quote</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Author Section */}
        <View style={styles.authorSection}>
          <View style={[styles.authorAvatar, { backgroundColor: randomPastel }]}>
            <Text style={styles.avatarText}>
              {quote.author.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{quote.author.display_name}</Text>
            <Text style={styles.quotedText}>
              quoted {guessable ? '???' : quote.quoted_user?.display_name ?? quote.quoted_name}
            </Text>
          </View>
        </View>

        {/* Quote Content */}
        <View style={[styles.quoteContainer, { backgroundColor: randomPastel + '15' }]}>
          <Text style={styles.quoteContent}>&ldquo;{quote.text}&rdquo;</Text>
        </View>

        {/* Guess Result */}
        {quote.has_guessed && (
          <View style={[
            styles.guessResultBanner,
            { backgroundColor: quote.guess?.correct ? theme.witnessButton + '20' : theme.destructive + '20' }
          ]}>
            <IconSymbol
              name={quote.guess?.skipped ? 'forward.fill' : quote.guess?.correct ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
              size={20}
              color={quote.guess?.correct ? theme.witnessButton : theme.destructive}
              style={{ marginRight: 8 }}
            />
            <Text style={[
              styles.guessResultText,
              { color: quote.guess?.correct ? theme.witnessButton : theme.destructive }
            ]}>
              {quote.guess?.skipped
                ? 'You skipped this guess'
                : quote.guess?.correct
                ? 'You guessed correctly!'
                : `Incorrect - It was ${quote.quoted_user?.display_name ?? quote.quoted_name}`}
            </Text>
          </View>
        )}

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <ActionChip
            icon="heart"
            activeIcon="heart.fill"
            active={!!quote.is_liked}
            label={quote.like_count}
            onPress={handleLike}
            color={theme.likeButton}
          />

          <View style={styles.toolbarDivider} />

          <ActionChip
            icon="eye"
            activeIcon="eye"
            // active state doesn't currently exist for witness; keep it neutral
            label={quote.witness_count}
            onPress={!guessable ? handleWitness : undefined}
            color={theme.witnessButton}
            disabled={guessable} // if guessable, encourage guessing instead of witnessing
          />

          {guessable && (
            <>
              <View style={styles.toolbarDivider} />
              <TouchableOpacity
                onPress={openGuessModal}
                style={[styles.guessPill, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <IconSymbol name="questionmark.circle.fill" size={16} color={theme.text} style={{ marginRight: 6 }} />
                <Text style={styles.guessPillText}>Guess</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Quote #{quote.id}
          </Text>
        </View>
      </ScrollView>

      {quote && (
        <GuessGameModal
          quote={quote}
          visible={showGuessModal}
          onClose={() => setShowGuessModal(false)}
          onGuess={handleGuess}
          theme={theme}
        />
      )}
    </ThemedView>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: theme.secondaryText,
      marginBottom: 20,
      textAlign: 'center',
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
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
      flex: 1,
    },
    authorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    authorAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '600',
      color: '#fff',
    },
    authorInfo: {
      flex: 1,
    },
    authorName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    quotedText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.secondaryText,
    },
    quoteContainer: {
      padding: 24,
      borderRadius: 16,
      marginBottom: 24,
    },
    quoteContent: {
      fontSize: 24,
      fontWeight: '300',
      lineHeight: 34,
      color: theme.text,
    },
    guessResultBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    guessResultText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.border,
      marginHorizontal: 16,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: theme.secondaryText,
    },
    actionButtons: {
      gap: 12,
      marginBottom: 24,
    },
    primaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    primaryActionText: {
      fontSize: 16,
      fontWeight: '600',
    },
    metadata: {
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    metadataText: {
      fontSize: 13,
      color: theme.secondaryText,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
      marginBottom: 16,
    },
    toolbarDivider: {
      width: 1,
      height: 20,
      backgroundColor: theme.border,
      marginHorizontal: 10,
    },
    guessPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
    },
    guessPillText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },    
  });

export default QuoteDetail;
