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
import QuoteResponseAction from '@/components/QuoteResponseAction';
import QuoteResponseBadge from '@/components/QuoteResponseBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';
import { getQuote, likeQuote, witnessQuote, guessQuote, respondToQuote } from '@/lib/api/quotes';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PillActionButton from '@/components/PillActionButton';
import { getPastelFromId } from '@/lib/utils/style';
import { timeAgo } from '@/lib/utils/timeAgo';
import { useQuoteActionsModal } from '@/context/QuoteActionsModalContext';

const QuoteDetail: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const navigation = useNavigation();
  const router = useRouter();
  const { openModal } = useQuoteActionsModal();

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

  // Refresh quote when returning from modal or when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh the quote when returning to this screen
      if (quote) {
        fetchQuote();
      }
    });

    return unsubscribe;
  }, [navigation, quote, fetchQuote]);

  // Reset modal state when quote changes
  useEffect(() => {
    setShowGuessModal(false);
  }, [quoteID]);

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

  const handleRespond = async (response: 'confirmed' | 'denied' | null) => {
    if (!quote) return;
    const previousResponse = quote.quoted_user_response;
    // Optimistic update
    setQuote({
      ...quote,
      quoted_user_response: response,
    });
    try {
      await respondToQuote(quote.id, response);
    } catch (err) {
      console.error('Error responding to quote:', err);
      // Rollback on failure
      setQuote({
        ...quote,
        quoted_user_response: previousResponse,
      });
    }
  };

  const openGuessModal = () => {
    // Allow opening modal if quote has guess options and user is not the author
    // Modal can be opened even after guess is made to see results
    if (quote && (quote.guess_options?.length ?? 0) > 1 && quote.author.id !== user?.id) {
      setShowGuessModal(true);
    } else {
      console.log('Cannot open guess modal:', {
        hasQuote: !!quote,
        optionsLength: quote?.guess_options?.length,
        isOwnQuote: quote?.author.id === user?.id,
      });
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const navigateToProfile = (userId: number) => {
    router.push({
      pathname: "/user/[userID]",
      params: { userID: userId },
    });
  };

  const openActionsModal = () => {
    if (quote) {
      openModal(quote);
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
          <ActivityIndicator size="large" />
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
  const randomPastel = getPastelFromId(quote.id, theme);
  const guessable = (!guessMade && quote.guess_options?.length > 1 && !(quote.author.id === user?.id));
  const showGuessButton = (quote.guess_options?.length > 1 && !(quote.author.id === user?.id));
  const hasGuessedAlready = guessMade || quote.has_guessed;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quote</Text>
        <TouchableOpacity
          onPress={openActionsModal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.menuButton}
        >
          <IconSymbol name="ellipsis" size={18} color={theme.secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Quote Header - Similar to FeedQuote */}
        <View style={styles.quoteHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            {guessable ? (
              <Text style={[styles.authorText, styles.mysteryText]}>???</Text>
            ) : (
              <TouchableOpacity onPress={() => navigateToProfile(quote.author.id)}>
                <Text style={styles.authorText}>{quote.author.display_name}</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.quotedLabelText}> quoted </Text>

            {guessable ? (
              <Text style={[styles.quotedNameText, styles.mysteryText]}>???</Text>
            ) : quote.quoted_user ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navigateToProfile(quote.quoted_user.id)}>
                  <Text style={styles.quotedNameText}>{quote.quoted_user.display_name}</Text>
                </TouchableOpacity>
                {/* Inline response badge */}
                {quote.quoted_user_response && !quote.can_respond && (
                  <QuoteResponseBadge response={quote.quoted_user_response} compact />
                )}
              </View>
            ) : (
              <Text style={styles.quotedNameText}>{quote.quoted_name}</Text>
            )}
          </View>
        </View>

        {/* Quote Content - Larger and centered */}
        <View style={styles.contentContainer}>
          <Text style={styles.quoteContent}>&ldquo;{quote.text}&rdquo;</Text>
        </View>

        {/* Timestamp */}
        <View style={styles.timestampContainer}>
          <Text style={styles.timestampText}>{timeAgo(quote.created_at)}</Text>
        </View>

        {/* Quoted User Response Action - only for quoted user */}
        {quote.can_respond && (
          <QuoteResponseAction
            currentResponse={quote.quoted_user_response as 'confirmed' | 'denied' | null}
            onRespond={handleRespond}
          />
        )}

        {/* Guess Result Banner */}
        {quote.has_guessed && quote.guess && (
          <View style={[
            styles.guessResultBanner,
            {
              backgroundColor: quote.guess.skipped
                ? theme.border + '40'
                : quote.guess.correct
                ? theme.witnessButton + '20'
                : theme.destructive + '20'
            }
          ]}>
            <IconSymbol
              name={quote.guess.skipped ? 'forward.fill' : quote.guess.correct ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
              size={22}
              color={quote.guess.skipped ? theme.secondaryText : quote.guess.correct ? theme.witnessButton : theme.destructive}
              style={{ marginRight: 10 }}
            />
            <Text style={[
              styles.guessResultText,
              { color: quote.guess.skipped ? theme.secondaryText : quote.guess.correct ? theme.witnessButton : theme.destructive }
            ]}>
              {quote.guess.skipped
                ? 'You skipped this guess'
                : quote.guess.correct
                ? 'You guessed correctly!'
                : `Incorrect guess - It was ${quote.quoted_user?.display_name ?? quote.quoted_name}`}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons - Using PillActionButton like FeedQuote */}
        <View style={styles.actionsBar}>
          <PillActionButton
            icon={
              <IconSymbol
                name={quote.is_liked ? 'heart.fill' : 'heart'}
                color={quote.is_liked ? theme.likeButton : theme.secondaryText}
                size={20}
                style={{ marginRight: 6 }}
              />
            }
            label={quote.like_count}
            color={quote.is_liked ? theme.likeButton : theme.secondaryText}
            borderColor={theme.border}
            highlightBgColor={theme.likeButton}
            onPress={handleLike}
          />

          {!guessable && (
            <PillActionButton
              icon={<Text style={{ marginRight: 6 }}>👀</Text>}
              label={`${quote.witness_count} ${quote.witness_count === 1 ? 'witness' : 'witnesses'}`}
              color={quote.is_witnessed ? theme.witnessButton : theme.secondaryText}
              borderColor={theme.border}
              highlightBgColor={theme.witnessButton}
              onPress={handleWitness}
            />
          )}

          {showGuessButton && (
            <PillActionButton
              icon={
                <IconSymbol
                  name={hasGuessedAlready ? "person.fill.checkmark" : "person.fill.viewfinder"}
                  color={theme.accent}
                  size={20}
                  style={{ marginRight: 6 }}
                />
              }
              label="YapGuess"
              color={theme.accent}
              borderColor={guessable ? theme.accent : theme.border}
              highlightBgColor={theme.accent}
              onPress={() => {
                console.log('YapGuess button pressed, guessable:', guessable, 'showGuessModal:', showGuessModal);
                openGuessModal();
              }}
              highlighted={guessable}
            />
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{quote.like_count}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{quote.witness_count}</Text>
            <Text style={styles.statLabel}>Witnesses</Text>
          </View>
        </View>
      </ScrollView>

      {quote && (
        <GuessGameModal
          quote={quote}
          visible={showGuessModal}
          onClose={() => setShowGuessModal(false)}
          onGuess={handleGuess}
          theme={theme}
          accent={randomPastel}
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
      borderBottomColor: theme.divider,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
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
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    quoteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    authorText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    quotedLabelText: {
      fontSize: 15,
      color: theme.secondaryText,
    },
    quotedNameText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    mysteryText: {
      fontWeight: '600',
      fontStyle: 'italic',
      color: theme.secondaryText,
    },
    contentContainer: {
      marginBottom: 24,
      paddingVertical: 16,
    },
    quoteContent: {
      fontSize: 32,
      lineHeight: 42,
      color: theme.text,
      fontWeight: '300',
      letterSpacing: 0.3,
      textAlign: 'left',
    },
    timestampContainer: {
      marginBottom: 24,
    },
    timestampText: {
      fontSize: 14,
      color: theme.secondaryText,
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
    divider: {
      height: 1,
      backgroundColor: theme.divider,
      marginBottom: 20,
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 32,
      flexWrap: 'wrap',
    },
    statsSection: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    statCard: {
      flex: 1,
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: theme.secondaryText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

export default QuoteDetail;
