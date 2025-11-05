import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Quote } from '@/types/api';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const { width: screenWidth } = Dimensions.get('window');

interface GuessGameModalProps {
  quote: Quote;
  visible: boolean;
  onClose: () => void;
  onGuess: (guessedUserId?: number, skipped?: boolean) => void;
  theme: any;
}

const GuessGameModal: React.FC<GuessGameModalProps> = ({
  quote,
  visible,
  onClose,
  onGuess,
  theme,
}) => {
  const styles = useThemedStyles(getModalStyles);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleGuess = (userId?: number, skipped?: boolean) => {
    onGuess(userId, skipped);
    setHasSubmitted(true);
    // Close modal after a short delay to show result
    setTimeout(() => {
      onClose();
      setHasSubmitted(false);
      setSelectedOption(null);
    }, 2000);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Guess Who Said It?
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Quote Display */}
        <View style={[styles.quoteDisplayContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.quoteDisplayText, { color: theme.text }]}>
            &ldquo;{quote.text}&rdquo;
          </Text>
        </View>

        {/* Guess Options */}
        {!hasSubmitted && quote.guess_options?.length ? (
          <View style={styles.optionsContainer}>
            <Text style={[styles.instructionText, { color: theme.secondaryText }]}>
              Who do you think said this?
            </Text>
            <View style={styles.optionsGrid}>
              {quote.guess_options.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.pastels[Object.keys(theme.pastels)[index % 5] as keyof typeof theme.pastels] },
                    selectedOption === option.id && styles.selectedOption,
                  ]}
                  onPress={() => {
                    setSelectedOption(option.id);
                    handleGuess(option.id);
                  }}
                >
                  <Text style={styles.optionText}>{option.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.skipButton, { backgroundColor: theme.secondaryText }]}
              onPress={() => handleGuess(undefined, true)}
            >
              <Text style={styles.skipText}>Skip This One</Text>
            </TouchableOpacity>
          </View>
        ) : (hasSubmitted && quote.guess) ? (
          <View style={styles.resultContainer}>
            <Text style={[
              styles.resultText,
              { color: quote.guess?.correct ? theme.witnessButton : theme.destructive }
            ]}>
              {quote.guess?.skipped
                ? '⏭️ Skipped!'
                : quote.guess?.correct
                ? '🎉 Correct!'
                : `❌ Wrong! It was ${quote.quoted_user?.display_name ?? quote.quoted_name}`}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const getModalStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      paddingTop: 60,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '600',
    },
    closeButton: {
      padding: 8,
    },
    quoteDisplayContainer: {
      margin: 20,
      padding: 24,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    quoteDisplayText: {
      fontSize: 20,
      lineHeight: 28,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    optionsContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    instructionText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 30,
    },
    optionButton: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 25,
      margin: 8,
      minWidth: screenWidth * 0.4,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    selectedOption: {
      transform: [{ scale: 0.95 }],
      opacity: 0.8,
    },
    optionText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111',
    },
    skipButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 20,
      alignSelf: 'center',
      marginTop: 20,
    },
    skipText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#fff',
    },
    resultContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    resultText: {
      fontSize: 24,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

export default GuessGameModal;
