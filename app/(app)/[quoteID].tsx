import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Quote } from '@/types/api';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { Colors, ProfileColorHexMap } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import GuessGameModal from '@/components/modals/GuessGameModal';
import GuessesModal from '@/components/modals/GuessesModal';
import { UserListModal } from '@/components/UserListModal';
import QuoteResponseAction from '@/components/QuoteResponseAction';
import QuoteResponseBadge from '@/components/QuoteResponseBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getQuote, likeQuote, witnessQuote, guessQuote, respondToQuote, getQuoteLikes, getQuoteWitnesses } from '@/lib/api/quotes';
import { getErrorMessage } from '@/lib/utils/error';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PillActionButton from '@/components/PillActionButton';
import { getPastelFromId } from '@/lib/utils/style';
import { timeAgo } from '@/lib/utils/timeAgo';
import { useQuoteActionsModal } from '@/context/QuoteActionsModalContext';
import { useUser } from '@/context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const QuoteDetail: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { openModal } = useQuoteActionsModal();
  const { patchUser, user } = useUser();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guessMade, setGuessMade] = useState(false);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [showGuessesModal, setShowGuessesModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showWitnessesModal, setShowWitnessesModal] = useState(false);

  const params = useLocalSearchParams();
  const { quoteID } = params;

  const fetchQuote = useCallback(async () => {
    const id = Number(quoteID);
    if (isNaN(id)) {
      setError('Invalid quote ID');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getQuote(id);
      setQuote(data);
      setGuessMade(!!data.has_guessed);
    } catch {
      setError("Couldn't load quote");
    } finally {
      setLoading(false);
    }
  }, [quoteID]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote, quoteID]);

  useEffect(() => {
    setShowGuessModal(false);
  }, [quoteID]);

  const handleLike = async () => {
    if (!quote) return;
    const previousIsLiked = quote.is_liked;
    const previousLikeCount = quote.like_count;
    setQuote({
      ...quote,
      is_liked: !quote.is_liked,
      like_count: quote.is_liked ? quote.like_count - 1 : quote.like_count + 1,
    });
    try {
      await likeQuote(quote.id);
    } catch (err) {
      console.error('Error liking quote:', err);
      setQuote((prev) => prev ? {
        ...prev,
        is_liked: previousIsLiked,
        like_count: previousLikeCount,
      } : null);
    }
  };

  const handleWitness = async () => {
    if (!quote || !user) return;
    const previousIsWitnessed = quote.is_witnessed;
    const previousWitnessCount = quote.witness_count;
    const previousWitnesses = quote.witnesses;
    const updatedWitnesses = quote.is_witnessed
      ? quote.witnesses.filter((w) => w.witness.id !== user.id)
      : [
          ...quote.witnesses,
          {
            id: -1,
            witness: { id: user.id, username: user.username, display_name: user.display_name, profile_color: user.profile_color ?? 'BLUE' },
            created_at: new Date().toISOString(),
          },
        ];
    setQuote({
      ...quote,
      is_witnessed: !quote.is_witnessed,
      witness_count: quote.is_witnessed ? quote.witness_count - 1 : quote.witness_count + 1,
      witnesses: updatedWitnesses,
    });
    try {
      await witnessQuote(quote.id);
    } catch (err) {
      console.error('Error witnessing quote:', err);
      setQuote((prev) => prev ? {
        ...prev,
        is_witnessed: previousIsWitnessed,
        witness_count: previousWitnessCount,
        witnesses: previousWitnesses,
      } : null);
    }
  };

  const handleGuess = async (userId?: number, skipped?: boolean) => {
    if (!quote) return;
    try {
      const result = await guessQuote(quote.id, userId, skipped);
      patchUser({ current_streak: result.current_streak, longest_streak: result.longest_streak });
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
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handleRespond = async (response: 'confirmed' | 'denied' | null) => {
    if (!quote) return;
    const previousResponse = quote.quoted_user_response;
    setQuote({
      ...quote,
      quoted_user_response: response,
    });
    try {
      await respondToQuote(quote.id, response);
    } catch (err) {
      console.error('Error responding to quote:', err);
      setQuote({
        ...quote,
        quoted_user_response: previousResponse,
      });
    }
  };

  const openGuessModal = () => {
    if (quote?.can_guess) {
      setShowGuessModal(true);
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

  const handleGuessesUserPress = (userId: number) => {
    setShowGuessesModal(false);
    navigateToProfile(userId);
  };

  const openActionsModal = () => {
    if (quote) {
      openModal(quote);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.navHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.navButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Quote</Text>
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
        <View style={[styles.navHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.navButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Quote</Text>
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

  const randomPastel = getPastelFromId(quote.id, theme);
  const guessable = quote.can_guess && !guessMade;
  const isAuthor = user?.id === quote.author.id;
  const hasGuessedAlready = guessMade || quote.has_guessed;
  const showGuessButton = quote.can_guess || hasGuessedAlready || isAuthor || !!quote.can_respond;

  const profileColor = guessable ? null
    : quote.quoted_user ? ProfileColorHexMap[quote.quoted_user.profile_color]
    : null;
  const gradientColors: [string, string, string] = [
    randomPastel,
    profileColor ?? randomPastel,
    'transparent',
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Nav Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.navButton}>
          <IconSymbol name="chevron.left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Quote</Text>
        <TouchableOpacity
          onPress={openActionsModal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.navButton}
        >
          <IconSymbol name="ellipsis" size={18} color={theme.secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Gradient accent bar — wider, horizontal evolution of the feed strip */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.accentBar}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Context — scene-setting detail above the quote */}
        {quote.context && !guessable ? (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={[styles.contextText, { color: randomPastel }]}>{quote.context}</Text>
          </Animated.View>
        ) : null}

        {/* Quote text — the hero */}
        <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.quoteSection}>
          <Text selectable style={styles.quoteText}>
            &ldquo;{quote.text}&rdquo;
          </Text>
        </Animated.View>

        {/* Attribution — who said it, who posted it, when */}
        <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.attribution}>
          <View style={styles.attributionNames}>
            {guessable ? (
              <Text style={styles.mysteryAttribution}>??? quoted by ???</Text>
            ) : (
              <>
                <View style={styles.attributionRow}>
                  {quote.quoted_user ? (
                    <TouchableOpacity onPress={() => navigateToProfile(quote.quoted_user.id)}>
                      <Text style={styles.quotedPersonName}>{quote.quoted_user.display_name}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.quotedPersonExternal}>{quote.quoted_name}</Text>
                  )}
                  {quote.quoted_user_response && (
                    <QuoteResponseBadge response={quote.quoted_user_response} />
                  )}
                </View>
                <Text style={styles.attributionLabel}>
                  posted by{' '}
                  <Text
                    style={styles.authorLink}
                    onPress={() => navigateToProfile(quote.author.id)}
                  >
                    {quote.author.display_name}
                  </Text>
                  {'  '}
                  <Text style={styles.timestampText}>{timeAgo(quote.created_at)}</Text>
                  {quote.updated_at && quote.created_at &&
                    Math.abs(new Date(quote.updated_at).getTime() - new Date(quote.created_at).getTime()) > 5000 && (
                      <Text style={styles.editedText}> (edited)</Text>
                  )}
                </Text>
              </>
            )}
          </View>
        </Animated.View>

        {/* Response action — only for quoted user */}
        {quote.can_respond && (
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.responseSection}>
            <QuoteResponseAction
              currentResponse={quote.quoted_user_response as 'confirmed' | 'denied' | null}
              onRespond={handleRespond}
            />
          </Animated.View>
        )}

        {/* Guess result banner */}
        {quote.has_guessed && quote.guess && (
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={[
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
              size={20}
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
          </Animated.View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(350).duration(300)} style={styles.actionsBar}>
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
            borderColor={theme.border}
            highlightBgColor={theme.likeButton}
            onPress={handleLike}
            onLongPress={() => setShowLikesModal(true)}
            highlighted={quote.is_liked}
          />

          {!guessable && (
            <PillActionButton
              icon={<Text style={{ marginRight: 6 }}>👀</Text>}
              label={`${quote.witness_count} ${quote.witness_count === 1 ? 'witness' : 'witnesses'}`}
              color={quote.is_witnessed ? theme.witnessButton : theme.secondaryText}
              borderColor={theme.border}
              highlightBgColor={theme.witnessButton}
              onPress={handleWitness}
              onLongPress={() => setShowWitnessesModal(true)}
              highlighted={quote.is_witnessed}
            />
          )}

          {showGuessButton && (
            (hasGuessedAlready || isAuthor || quote.can_respond) ? (
              <PillActionButton
                icon={
                  <IconSymbol
                    name="person.2.fill"
                    color={theme.secondaryText}
                    size={18}
                    style={{ marginRight: 6 }}
                  />
                }
                label="Guesses"
                color={theme.secondaryText}
                borderColor={theme.border}
                highlightBgColor={theme.accent}
                onPress={() => setShowGuessesModal(true)}
              />
            ) : (
              <PillActionButton
                icon={
                  <IconSymbol
                    name="person.fill.viewfinder"
                    color={theme.accent}
                    size={18}
                    style={{ marginRight: 6 }}
                  />
                }
                label="YapGuess"
                color={theme.accent}
                borderColor={theme.accent}
                highlightBgColor={theme.accent}
                onPress={openGuessModal}
              />
            )
          )}
        </Animated.View>

        {/* Witness chips — surfaces who was there without opening the modal */}
        {!guessable && quote.witnesses.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(300)} style={styles.witnessChipsSection}>
            <Text style={styles.witnessChipsLabel}>witnessed by</Text>
          <View style={styles.witnessChipsRow}>
            {quote.witnesses.slice(0, 4).map((w) => (
              <TouchableOpacity
                key={w.witness.id}
                style={styles.witnessChip}
                onPress={() => navigateToProfile(w.witness.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.witnessChipText}>@{w.witness.username}</Text>
              </TouchableOpacity>
            ))}
            {quote.witness_count > 4 && (
              <TouchableOpacity
                style={[styles.witnessChip, styles.witnessChipMore]}
                onPress={() => setShowWitnessesModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.witnessChipMoreText}>+{quote.witness_count - 4} more</Text>
              </TouchableOpacity>
            )}
          </View>
          </Animated.View>
        )}
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

      {quote && (
        <GuessesModal
          visible={showGuessesModal}
          onClose={() => setShowGuessesModal(false)}
          quoteId={quote.id}
          quotedUser={quote.quoted_user}
          onUserPress={handleGuessesUserPress}
        />
      )}

      {quote && (
        <UserListModal
          visible={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          title="Likes"
          fetcher={({ url }) => getQuoteLikes(quote.id, url)}
          onUserPress={(u) => {
            setShowLikesModal(false);
            navigateToProfile(u.id);
          }}
          emptyMessage="No likes yet"
        />
      )}

      {quote && (
        <UserListModal
          visible={showWitnessesModal}
          onClose={() => setShowWitnessesModal(false)}
          title="Witnesses"
          fetcher={({ url }) => getQuoteWitnesses(quote.id, url)}
          onUserPress={(u) => {
            setShowWitnessesModal(false);
            navigateToProfile(u.id);
          }}
          emptyMessage="No witnesses yet"
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
    navHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: 12,
    },
    navButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitle: {
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
      borderCurve: 'continuous',
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
      paddingHorizontal: Spacing.lg,
    },

    // Gradient accent — horizontal bar at top, evolves the feed card's vertical strip
    accentBar: {
      height: 3,
      marginBottom: Spacing.xl,
      marginHorizontal: -Spacing.lg,
      overflow: 'hidden',
    },

    // Context
    contextText: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: Spacing.md,
    },

    // Quote — the hero
    quoteSection: {
      marginBottom: Spacing.lg,
    },
    quoteText: {
      fontSize: 32,
      lineHeight: 44,
      color: theme.text,
      fontFamily: 'Lora',
      fontWeight: 'normal',
      letterSpacing: 0.2,
    },

    // Attribution
    attribution: {
      marginBottom: Spacing.lg,
    },
    attributionNames: {
      gap: 4,
    },
    attributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    quotedPersonName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    quotedPersonExternal: {
      fontSize: 16,
      fontWeight: '400',
      fontStyle: 'italic',
      color: theme.secondaryText,
    },
    mysteryAttribution: {
      fontSize: 15,
      fontWeight: '600',
      fontStyle: 'italic',
      color: theme.secondaryText,
    },
    attributionLabel: {
      fontSize: 14,
      color: theme.secondaryText,
    },
    authorLink: {
      fontWeight: '500',
      color: theme.secondaryText,
    },
    timestampText: {
      fontSize: 13,
      color: theme.secondaryText,
      opacity: 0.6,
    },
    editedText: {
      fontSize: 12,
      fontStyle: 'italic',
      color: theme.secondaryText,
      opacity: 0.6,
    },

    // Response action
    responseSection: {
      marginBottom: Spacing.md,
    },

    // Guess result
    guessResultBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: 12,
      borderCurve: 'continuous',
      marginBottom: Spacing.md,
    },
    guessResultText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
    },

    // Divider
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.divider,
      marginBottom: Spacing.md,
    },

    // Actions
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm + 2,
      flexWrap: 'wrap',
    },

    // Witness chips
    witnessChipsSection: {
      marginTop: Spacing.md,
      gap: Spacing.xs,
    },
    witnessChipsLabel: {
      fontSize: 13,
      color: theme.secondaryText,
      opacity: 0.7,
    },
    witnessChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    witnessChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
    },
    witnessChipText: {
      fontSize: 13,
      color: theme.secondaryText,
    },
    witnessChipMore: {
      backgroundColor: 'transparent',
    },
    witnessChipMoreText: {
      fontSize: 13,
      color: theme.secondaryText,
      opacity: 0.6,
    },
  });

export default QuoteDetail;
