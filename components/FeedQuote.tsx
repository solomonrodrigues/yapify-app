import GuessGameModal from '@/components/modals/GuessGameModal';
import GuessesModal from '@/components/modals/GuessesModal';
import PillActionButton from '@/components/PillActionButton';
import QuoteResponseAction from '@/components/QuoteResponseAction';
import QuoteResponseBadge from '@/components/QuoteResponseBadge';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserListModal } from '@/components/UserListModal';
import { Colors, ProfileColorHexMap } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useQuoteActionsModal } from '@/context/QuoteActionsModalContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getQuoteLikes, getQuoteWitnesses } from '@/lib/api/quotes';
import { getPastelFromId } from '@/lib/utils/style';
import { PublicUser, Quote } from '@/types/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';


interface FeedQuoteProps {
  quote: Quote;
  theme: any;
  index?: number;
  onLike: (quoteId: number) => void;
  onWitness: (quoteId: number) => void;
  onGuess: (quoteId: number, guessedUserId?: number, skipped?: boolean) => void;
  onSave?: (quoteId: number) => void;
  onUnsave?: (quoteId: number) => void;
  onUnhide?: (quoteId: number) => void;
  onRespond?: (quoteId: number, response: 'confirmed' | 'denied' | null) => void;
}

const FeedQuote: React.FC<FeedQuoteProps> = ({
  quote,
  theme,
  index = 0,
  onLike,
  onWitness,
  onGuess,
  onSave,
  onUnsave,
  onUnhide,
  onRespond,
}) => {
  const styles = useThemedStyles(getStyles);

  // Entrance animation (only for first 10 items)
  const opacity = useSharedValue(index < 10 ? 0 : 1);
  const translateY = useSharedValue(index < 10 ? 20 : 0);

  useEffect(() => {
    if (index < 10) {
      const delay = index * 80;
      opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }));
    }
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const [guessMade, setGuessMade] = useState(!!quote.has_guessed);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [showGuessesModal, setShowGuessesModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showWitnessesModal, setShowWitnessesModal] = useState(false);
  const router = useRouter();
  const { openModal } = useQuoteActionsModal();

  // Random but deterministic pastel for the background (based on ID)
  const randomPastel = getPastelFromId(quote.id, theme);
  // Use can_guess (server determines if user can guess: not author, not quoted_user, hasn't guessed)
  const guessable = quote.can_guess && !guessMade;
  // Show guess UI if user can guess or has already guessed (hides for author/quoted_user)
  const showGuessButton = quote.can_guess || quote.has_guessed;
  const hasGuessedAlready = guessMade || quote.has_guessed;

  const handleGuess = (userId?: number, skipped?: boolean) => {
    onGuess(quote.id, userId, skipped);
    setGuessMade(true);
  };

  const openGuessModal = () => {
    setShowGuessModal(true);
  };

  const navigateToProfile = (userId: number) => {
    router.push({
      pathname: "/user/[userID]",
      params: { userID: userId },
    });
  };

  const openActionsModal = () => {
    openModal(quote);
  };

  const handleUnhide = () => {
    if (onUnhide) {
      onUnhide(quote.id);
    }
  };

  // Fetchers for UserListModal
  const likesFetcher = useCallback(
    async ({ url, search }: { url?: string | null; search?: string }) => {
      return await getQuoteLikes(quote.id, url);
    },
    [quote.id]
  );

  const witnessesFetcher = useCallback(
    async ({ url, search }: { url?: string | null; search?: string }) => {
      return await getQuoteWitnesses(quote.id, url);
    },
    [quote.id]
  );

  const handleUserPress = (pressedUser: PublicUser) => {
    setShowLikesModal(false);
    setShowWitnessesModal(false);
    router.push({ pathname: '/user/[userID]', params: { userID: String(pressedUser.id) } });
  };

  const handleGuessesUserPress = (userId: number) => {
    setShowGuessesModal(false);
    router.push({ pathname: '/user/[userID]', params: { userID: String(userId) } });
  };

  // If quote is hidden, show a collapsed version with undo option
  if (quote.is_hidden) {
    return (
      <View style={[styles.quoteContainer, styles.hiddenContainer]}>
        <View style={styles.hiddenContent}>
          <IconSymbol
            name="eye.slash"
            size={14}
            color={theme.secondaryText}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.hiddenText}>Quote hidden</Text>
          <Text style={styles.hiddenDot}> · </Text>
          <TouchableOpacity onPress={handleUnhide} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.undoLink}>Undo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const profileColor = quote.quoted_user
    ? ProfileColorHexMap[quote.quoted_user.profile_color]
    : null;
  const gradientColors: [string, string] = [
    randomPastel,
    profileColor ?? randomPastel,
  ];

  return (
    <Animated.View style={[styles.quoteContainer, entranceStyle]}>
      {/* Gradient left strip */}
      <View style={styles.gradientStrip}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header: "X quoted Y" */}
      <View style={styles.header}>
        <View style={styles.headerNames}>
          {guessable ? (
            <Text style={[styles.headerText, styles.mysteryText]}>???</Text>
          ) : (
            <TouchableOpacity onPress={() => navigateToProfile(quote.author.id)}>
              <Text style={styles.authorName}>{quote.author.display_name}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.headerText}> quoted </Text>

          {guessable ? (
            <Text style={[styles.headerText, styles.mysteryText]}>???</Text>
          ) : quote.quoted_user ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigateToProfile(quote.quoted_user.id)}>
                <Text style={styles.quotedNameLink}>{quote.quoted_user.display_name}</Text>
              </TouchableOpacity>
              {/* Inline response badge - compact version next to name */}
              {quote.quoted_user_response && (
                <QuoteResponseBadge response={quote.quoted_user_response} compact />
              )}
            </View>
          ) : (
            <Text style={styles.externalName}>{quote.quoted_name}</Text>
          )}
        </View>

        {/* Right side: three-dots menu */}
        <TouchableOpacity
          onPress={openActionsModal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            name="ellipsis"
            size={18}
            color={theme.secondaryText}
          />
        </TouchableOpacity>
      </View>

      {/* Context - scene-setting detail before the quote */}
      {quote.context && !guessable ? (
        <Text style={[styles.contextText, { color: randomPastel }]}>{quote.context}</Text>
      ) : null}

      {/* Quote Content - Hero Element */}
      <View style={styles.contentContainer}>
        <Text style={styles.quoteContent}>&ldquo;{quote.text}&rdquo;</Text>
      </View>

      {/* Quoted User Response Action - only show for the quoted user */}
      {quote.can_respond && onRespond && (
        <QuoteResponseAction
          currentResponse={quote.quoted_user_response as 'confirmed' | 'denied' | null}
          onRespond={(response) => onRespond(quote.id, response)}
        />
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
          borderColor={theme.border}
          highlightBgColor={theme.likeButton}
          onPress={() => onLike(quote.id)}
          onLongPress={() => setShowLikesModal(true)}
          highlighted={quote.is_liked}
          testID="like-button"
        />

        {!guessable && (
          <PillActionButton
            icon={
              <Text style={{ marginRight: 6 }} >👀</Text>
            }
            label={`${quote.witness_count} ${quote.witness_count === 1 ? 'witness' : 'witnesses'}`}
            color={quote.is_witnessed ? theme.witnessButton : theme.secondaryText}
            borderColor={theme.border}
            highlightBgColor={theme.witnessButton}
            onPress={() => onWitness(quote.id)}
            onLongPress={() => setShowWitnessesModal(true)}
            highlighted={quote.is_witnessed}
            testID="witness-button"
          />
        )}

        {showGuessButton && (
          hasGuessedAlready ? (
            // After guessing: show "Guesses" button that opens GuessesModal
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
              testID="guesses-button"
            />
          ) : (
            // Before guessing: show "YapGuess" button that opens GuessGameModal
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
              highlighted={true}
              testID="guess-button"
            />
          )
        )}
      </View>

      <GuessGameModal
        quote={quote}
        visible={showGuessModal}
        onClose={() => setShowGuessModal(false)}
        onGuess={handleGuess}
        theme={theme}
        accent={randomPastel}
      />

      <UserListModal
        visible={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        title="Likes"
        fetcher={likesFetcher}
        onUserPress={handleUserPress}
        searchable={false}
        emptyMessage="No likes yet"
      />

      <UserListModal
        visible={showWitnessesModal}
        onClose={() => setShowWitnessesModal(false)}
        title="Witnesses"
        fetcher={witnessesFetcher}
        onUserPress={handleUserPress}
        searchable={false}
        emptyMessage="No witnesses yet"
      />

      <GuessesModal
        visible={showGuessesModal}
        onClose={() => setShowGuessesModal(false)}
        quoteId={quote.id}
        quotedUser={quote.quoted_user}
        onUserPress={handleGuessesUserPress}
      />
    </Animated.View>
  );
};

export default FeedQuote;

export const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    quoteContainer: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm + Spacing.xs,
      marginHorizontal: 10,
      marginVertical: 6,
      backgroundColor: theme.cardBackground,
      borderRadius: 14,
      overflow: 'hidden',
    },
    gradientStrip: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    headerNames: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    authorName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.secondaryText,
    },
    headerText: {
      fontSize: 14,
      color: theme.secondaryText,
    },
    quotedNameLink: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    externalName: {
      fontSize: 14,
      fontWeight: '400',
      fontStyle: 'italic',
      color: theme.secondaryText,
    },
    mysteryText: {
      fontWeight: '600',
      fontStyle: 'italic',
    },
    contentContainer: {
      marginBottom: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    contextText: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: Spacing.xs,
    },
    quoteContent: {
      fontSize: 27,
      lineHeight: 36,
      color: theme.text,
      fontFamily: 'Lora',
      fontWeight: 'normal',
      letterSpacing: 0.3,
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm + 2,
      paddingVertical: Spacing.sm + 2,
    },
    hiddenContainer: {
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
    },
    hiddenContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    hiddenText: {
      fontSize: 13,
      color: theme.secondaryText,
    },
    hiddenDot: {
      fontSize: 13,
      color: theme.secondaryText,
      opacity: 0.4,
    },
    undoLink: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.accent,
    },
  }
);
