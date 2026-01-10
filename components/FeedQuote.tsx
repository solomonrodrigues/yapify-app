import GuessGameModal from '@/components/modals/GuessGameModal';
import PillActionButton from '@/components/PillActionButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserListModal } from '@/components/UserListModal';
import { Colors } from '@/constants/Colors';
import { useQuoteActionsModal } from '@/context/QuoteActionsModalContext';
import { useUser } from '@/context/UserContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getQuoteLikes, getQuoteWitnesses } from '@/lib/api/quotes';
import { getPastelFromId } from '@/lib/utils/style';
import { PublicUser, Quote } from '@/types/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


interface FeedQuoteProps {
  quote: Quote;
  theme: any;
  onLike: (quoteId: number) => void;
  onWitness: (quoteId: number) => void;
  onGuess: (quoteId: number, guessedUserId?: number, skipped?: boolean) => void;
  onSave?: (quoteId: number) => void;
  onUnsave?: (quoteId: number) => void;
  onUnhide?: (quoteId: number) => void;
}

const FeedQuote: React.FC<FeedQuoteProps> = ({
  quote,
  theme,
  onLike,
  onWitness,
  onGuess,
  onSave,
  onUnsave,
  onUnhide,
}) => {
  const styles = useThemedStyles(getStyles);
  const [guessMade, setGuessMade] = useState(!!quote.has_guessed);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showWitnessesModal, setShowWitnessesModal] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const { openModal } = useQuoteActionsModal();

  // Random but deterministic pastel for the background (based on ID)
  const randomPastel = getPastelFromId(quote.id, theme);
  const guessable = (!guessMade && quote.guess_options?.length > 1 && !(quote.author.id === user?.id));
  const showGuessButton = (quote.guess_options?.length > 1 && !(quote.author.id === user?.id));
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

  // If quote is hidden, show a collapsed version with undo option
  if (quote.is_hidden) {
    return (
      <View style={[styles.quoteContainer, styles.hiddenContainer, { backgroundColor: theme.background }]}>
        <View style={styles.hiddenContent}>
          <View style={styles.hiddenLeftSection}>
            <IconSymbol
              name="eye.slash"
              size={16}
              color={theme.secondaryText}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.hiddenText}>Quote hidden</Text>
          </View>
          <TouchableOpacity onPress={handleUnhide} style={styles.undoButton}>
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
      </View>
    );
  }

  return (
    <View style={[styles.quoteContainer, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        ]}
      >
        {/* Left side: “X quoted Y” */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
          {guessable ? (
            <Text style={[styles.quotedText, styles.mysteryText]}>???</Text>
          ) : (
            <TouchableOpacity onPress={() => navigateToProfile(quote.author.id)}>
              <Text style={styles.authorName}>{guessable ? '???' : quote.author.display_name}</Text>
            </TouchableOpacity>
          )}

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

      {/* Quote Content - Hero Element */}
      <View style={styles.contentContainer}>
        <Text style={styles.quoteContent}>&ldquo;{quote.text}&rdquo;</Text>
      </View>

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
          // highlighted={quote.is_liked}
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
            // highlighted={quote.is_witnessed}
            testID="witness-button"
          />
        )}

        {showGuessButton && (
          <PillActionButton
            icon={
              <IconSymbol
                name={hasGuessedAlready ? "person.fill.checkmark" : "person.fill.viewfinder"}
                color={theme.accent}
                size={18}
                style={{ marginRight: 6 }}
              />
            }
            label="YapGuess"
            color={theme.accent}
            borderColor={guessable ? theme.accent : theme.border}
            highlightBgColor={theme.accent}
            onPress={openGuessModal}
            highlighted={guessable}
            testID="guess-button"
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
    </View>
  );
};

export default FeedQuote;

export const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
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
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
    },
    divider: {
      height: 1,
      backgroundColor: theme.divider,
      marginTop: 10,
      marginHorizontal: -16,
    },
    hiddenContainer: {
      opacity: 0.6,
      paddingTop: 12,
      paddingBottom: 8,
    },
    hiddenContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    hiddenLeftSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    hiddenText: {
      fontSize: 14,
      color: theme.secondaryText,
      fontStyle: 'italic',
    },
    undoButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: theme.accent,
      borderRadius: 6,
    },
    undoText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.background,
    },
  }
);
