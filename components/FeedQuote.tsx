import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Quote } from '@/types/api';
import { IconSymbol } from '@/components/ui/IconSymbol';
import GuessGameModal from '@/components/modals/GuessGameModal';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import PillActionButton from '@/components/PillActionButton';
import { getPastelFromId } from '@/lib/utils/style';
import { getStyles } from '@/app/(app)/(tabs)';


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
  const randomPastel = getPastelFromId(quote.id, theme);
  const guessable = (!guessMade && quote.guess_options?.length > 1 && !(quote.author.id === user?.id));
  const showGuessButton = (quote.guess_options?.length > 1 && !(quote.author.id === user?.id));

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

  return (
    <View style={[styles.quoteContainer, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
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

        {showGuessButton && (
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
    </View>
  );
};

export default FeedQuote;
