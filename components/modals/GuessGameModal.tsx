import React, { useMemo, useState } from 'react';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import BurstParticles from '../animated/BurstParticles';

const { width: screenWidth } = Dimensions.get('window');

interface GuessGameModalProps {
  quote: Quote;
  visible: boolean;
  onClose: () => void;
  onGuess: (guessedUserId?: number, skipped?: boolean) => void;
  theme: any;
  accent: string;
}

const GuessGameModal: React.FC<GuessGameModalProps> = ({
  quote,
  visible,
  onClose,
  onGuess,
  theme,
  accent,
}) => {
  const styles = useThemedStyles(getModalStyles);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // ---- Single accent palette (low-chroma neutrals around one hue)
  const palette = useMemo(() => {
    const withAlpha = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return {
      accent,
      accentSoft: withAlpha(accent, 0.12),
      accentSofter: withAlpha(accent, 0.06),
      accentPress: withAlpha(accent, 0.18),
      border: theme.hairline ?? withAlpha('#000000', 0.08),
      text: theme.text,
      textMuted: theme.secondaryText,
      card: theme.cardBackground,
      bg: theme.modalBackground,
    };
  }, [accent, theme]);

  const successScale = useSharedValue(1);

  React.useEffect(() => {
    // trigger only when we show a correct result
    if (hasSubmitted && quote?.guess?.correct) {
      successScale.value = 0.94;
      successScale.value = withSequence(
        withSpring(1.08, { damping: 14, stiffness: 300 }),
        withSpring(1, { damping: 16, stiffness: 240 })
      );
    }
  }, [hasSubmitted, quote?.guess?.correct, successScale]);

  const badgeSpringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const handleGuess = (userId?: number, skipped?: boolean) => {
    onGuess(userId, skipped);
    setHasSubmitted(true);
  };

  // Helper to know the correct option id (if available)
  const correctId = quote?.quoted_user?.id ?? null;
  const isPostGuess = hasSubmitted || !!quote?.guess;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: palette.bg }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.brandRow}>
            <View style={[styles.brandPill, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
              <IconSymbol name="person.fill.questionmark" size={14} color={palette.accent} />
              <Text style={[styles.brandText, { color: palette.accent }]}>YapGuess</Text>
            </View>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Who said it?</Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.iconBtn, { backgroundColor: palette.accentSofter, borderColor: palette.border }]}
            activeOpacity={0.8}
          >
            <IconSymbol name="xmark" size={18} color={palette.text} />
          </TouchableOpacity>
        </View>

        {/* Quote Card */}
        <View style={[styles.quoteCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <IconSymbol name="quote.opening" size={16} color={palette.text} />
          <Text style={[styles.quoteText, { color: palette.text }]}>
            “{quote.text}”
          </Text>
          <IconSymbol name="quote.closing" size={16} color={palette.text} />
        </View>

        {/* Body */}
        <View style={styles.optionsContainer}>
          {!isPostGuess ? (
            <>
              <Text style={[styles.instructionText, { color: palette.textMuted }]}>
                Tap to make your guess
              </Text>

              <View style={styles.optionsGrid}>
                {quote.guess_options?.map((option) => {
                  const isSelected = selectedOption === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      activeOpacity={0.9}
                      style={[
                        styles.optionButton,
                        {
                          borderColor: palette.accent,
                          backgroundColor: isSelected ? palette.accent : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setSelectedOption(option.id);
                        handleGuess(option.id);
                      }}
                    >
                      <View style={styles.optionContent}>
                        <Text
                          style={[
                            styles.optionText,
                            { color: isSelected ? '#FFFFFF' : palette.text },
                          ]}
                          numberOfLines={1}
                        >
                          {option.display_name}
                        </Text>
                        {!!option.username && (
                          <Text
                            style={[
                              styles.optionSubText,
                              { color: isSelected ? 'rgba(255,255,255,0.85)' : palette.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            @{option.username}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[
                  styles.skipButton,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.accentSofter,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => handleGuess(undefined, true)}
              >
                <IconSymbol name="forward.fill" size={14} color={palette.text} />
                <Text style={[styles.skipText, { color: palette.text }]}>Skip</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Result banner */}
              <Animated.View
                entering={ZoomIn.springify().damping(16)}
                style={styles.resultContainer}
              >
                <Animated.View
                  style={[
                    styles.resultBadge,
                    { backgroundColor: palette.accentSoft, borderColor: palette.border },
                    quote.guess?.correct ? badgeSpringStyle : null,
                  ]}
                >
                  <IconSymbol
                    name={
                      quote.guess?.skipped
                        ? 'forward.fill'
                        : quote.guess?.correct
                        ? 'checkmark.seal.fill'
                        : 'xmark.octagon'
                    }
                    size={18}
                    color={palette.accent}
                  />
                  <Text style={[styles.resultText, { color: palette.text }]}>
                    {quote.guess?.skipped
                      ? 'Skipped'
                      : quote.guess?.correct
                      ? 'Correct'
                      : `Oops. It was ${quote.quoted_user?.display_name ?? quote.quoted_name}`}
                  </Text>
                </Animated.View>

                <BurstParticles color={palette.accent} active={!!quote.guess?.correct} />
              </Animated.View>

              {/* Post-guess: show grid with locked states */}
              <View style={styles.optionsGrid}>
                {quote.guess_options?.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const isCorrect = correctId != null ? option.id === correctId : false;
                  const showCheck = isCorrect || (isSelected && quote.guess?.correct);
                  const showCross = isSelected && !quote.guess?.correct && !isCorrect;

                  // Visual state
                  const bg = isCorrect
                    ? palette.accentSoft
                    : showCross
                    ? palette.accentSofter
                    : 'transparent';
                  const br = isCorrect
                    ? palette.accent
                    : showCross
                    ? palette.border
                    : palette.border;

                  return (
                    <View
                      key={option.id}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: bg,
                          borderColor: br,
                          opacity: 1,
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <View style={styles.optionContentRow}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.optionText,
                              { color: palette.text },
                            ]}
                            numberOfLines={1}
                          >
                            {option.display_name}
                          </Text>
                          {!!option.username && (
                            <Text
                              style={[
                                styles.optionSubText,
                                { color: palette.textMuted },
                              ]}
                              numberOfLines={1}
                            >
                              @{option.username}
                            </Text>
                          )}
                        </View>

                        {showCheck && (
                          <View style={[styles.statePill, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}>
                            <IconSymbol name="checkmark" size={14} color={palette.accent} />
                          </View>
                        )}
                        {showCross && (
                          <View style={[styles.statePill, { backgroundColor: palette.accentSofter, borderColor: palette.border }]}>
                            <IconSymbol name="xmark" size={14} color={palette.text} />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Footer action */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.9}
                  style={[
                    styles.doneButton,
                    { backgroundColor: palette.accent, borderColor: palette.accent },
                  ]}
                >
                  <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={[styles.doneText, { color: '#FFFFFF' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const getModalStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      paddingTop: 52,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    brandRow: {
      flexDirection: 'column',
      gap: 8,
      flexShrink: 1,
    },
    brandPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      alignSelf: 'flex-start',
    },
    brandText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    iconBtn: {
      padding: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    quoteCard: {
      marginHorizontal: 20,
      marginTop: 14,
      marginBottom: 18,
      paddingVertical: 22,
      paddingHorizontal: 18,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      gap: 10,
    },
    quoteText: {
      fontSize: 18,
      lineHeight: 26,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    optionsContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    instructionText: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 16,
      gap: 12,
    },
    optionButton: {
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 16,
      marginHorizontal: 6,
      minWidth: screenWidth * 0.42,
      alignItems: 'stretch',
      borderWidth: 1,
    },
    optionContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    optionText: {
      fontSize: 15,
      fontWeight: '700',
    },
    optionSubText: {
      fontSize: 12.5,
      fontWeight: '500',
      marginTop: 2,
    },
    statePill: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      alignSelf: 'center',
    },
    skipButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      alignSelf: 'center',
      marginTop: 10,
    },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
    },
    resultContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 18,
    },
    resultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
    },
    resultText: {
      fontSize: 16,
      fontWeight: '700',
    },
    footerRow: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    doneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    doneText: {
      fontSize: 15,
      fontWeight: '700',
    },
  });

export default GuessGameModal;
