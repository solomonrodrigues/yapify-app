import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Quote, MinimalUser } from '@/types/api';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import BurstParticles from '../animated/BurstParticles';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------- Types ----------

interface GuessGameModalProps {
  quote: Quote;
  visible: boolean;
  onClose: () => void;
  onGuess: (guessedUserId?: number, skipped?: boolean) => void;
  theme: typeof Colors.light | typeof Colors.dark;
  accent: string;
  milestoneMessage?: { text1: string; text2: string } | null;
}

type ModalPalette = {
  accent: string;
  accentSoft: string;
  accentMedium: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  correct: string;
  correctSoft: string;
  incorrect: string;
  incorrectSoft: string;
};

// ---------- Styles (defined before tile components so they can reference it) ----------

const getModalStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },

    // ---- Header ----
    header: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    grabber: {
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.border,
    },
    closeBtn: {
      position: 'absolute',
      right: 16,
      top: 8,
    },
    closeBtnCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ---- Quote card ----
    quoteCardWrap: {
      marginTop: 8,
      marginBottom: 24,
    },
    quoteCard: {
      marginHorizontal: 16,
      padding: 24,
      borderRadius: 20,
      borderCurve: 'continuous',
      alignItems: 'center',
    },
    quotePrompt: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.8,
      marginBottom: 16,
    },
    quoteText: {
      fontSize: 22,
      lineHeight: 32,
      fontFamily: 'Lora',
      textAlign: 'center',
      letterSpacing: 0.2,
    },

    // ---- Options grid ----
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 10,
    },
    optionTile: {
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 12,
      borderRadius: 18,
      borderWidth: 1.5,
      borderCurve: 'continuous',
      gap: 8,
    },
    optionName: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    optionUsername: {
      fontSize: 11,
      fontWeight: '500',
      textAlign: 'center',
    },

    // ---- Locked tile avatar badge ----
    lockedAvatarWrap: {
      position: 'relative',
    },
    avatarBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.cardBackground,
    },

    // ---- Confirm area ----
    confirmArea: {
      paddingHorizontal: 16,
      marginTop: 20,
      gap: 12,
      alignItems: 'center',
    },
    confirmBtn: {
      paddingVertical: 15,
      borderRadius: 999,
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    confirmBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },

    // ---- Skip ----
    skipWrap: {
      alignItems: 'center',
      marginTop: 20,
    },
    skipBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 999,
    },
    skipLabel: {
      fontSize: 14,
      fontWeight: '500',
    },

    // ---- Checking ----
    checkingWrap: {
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 20,
    },

    // ---- Result ----
    resultWrap: {
      alignItems: 'center',
      marginBottom: 20,
    },
    resultPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 999,
    },
    resultLabel: {
      fontSize: 16,
      fontWeight: '700',
    },

    // ---- Milestone ----
    milestoneWrap: {
      alignItems: 'center',
      marginTop: 24,
    },
    milestoneText1: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    milestoneText2: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      marginTop: 3,
    },

    // ---- Done ----
    doneWrap: {
      alignItems: 'center',
      marginTop: 24,
    },
    doneBtn: {
      paddingVertical: 15,
      paddingHorizontal: 48,
      borderRadius: 999,
    },
    doneBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
  });

// ---------- OptionTile (module-level so identity is stable across parent re-renders) ----------

interface OptionTileProps {
  option: MinimalUser;
  index: number;
  isPending: boolean;
  optionWidth: number;
  palette: ModalPalette;
  onSelect: (id: number | null) => void;
}

const OptionTile = React.memo<OptionTileProps>(({
  option, index, isPending, optionWidth, palette, onSelect,
}) => {
  const styles = useThemedStyles(getModalStyles);
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 60).duration(300).springify()}
      style={{ width: optionWidth }}
    >
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onSelect(isPending ? null : option.id)}
        style={[
          styles.optionTile,
          {
            backgroundColor: isPending ? palette.accentMedium : palette.card,
            borderColor: isPending ? palette.accent : palette.border,
          },
        ]}
      >
        <InitialsAvatar user={option} size={36} defaultBorder={false} />
        <Text style={[styles.optionName, { color: palette.text }]} numberOfLines={1}>
          {option.display_name}
        </Text>
        {!!option.username && (
          <Text style={[styles.optionUsername, { color: palette.textMuted }]} numberOfLines={1}>
            @{option.username}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ---------- LockedTile (module-level for the same reason) ----------

interface LockedTileProps {
  option: MinimalUser;
  optionWidth: number;
  isCorrect: boolean;
  isWrong: boolean;
  palette: ModalPalette;
}

const LockedTile = React.memo<LockedTileProps>(({
  option, optionWidth, isCorrect, isWrong, palette,
}) => {
  const styles = useThemedStyles(getModalStyles);
  const tileBg = isCorrect ? palette.correctSoft : isWrong ? palette.incorrectSoft : palette.card;
  const tileBorder = isCorrect ? palette.correct : isWrong ? palette.incorrect : palette.border;

  return (
    <View
      style={[styles.optionTile, { width: optionWidth, backgroundColor: tileBg, borderColor: tileBorder }]}
      pointerEvents="none"
    >
      <View style={styles.lockedAvatarWrap}>
        <InitialsAvatar user={option} size={36} defaultBorder={false} />
        {isCorrect && (
          <Animated.View
            entering={ZoomIn.delay(200).springify()}
            style={[styles.avatarBadge, { backgroundColor: palette.correct }]}
          >
            <IconSymbol name="checkmark" size={9} color="#fff" />
          </Animated.View>
        )}
        {isWrong && (
          <Animated.View
            entering={ZoomIn.delay(200).springify()}
            style={[styles.avatarBadge, { backgroundColor: palette.incorrect }]}
          >
            <IconSymbol name="xmark" size={9} color="#fff" />
          </Animated.View>
        )}
      </View>
      <Text style={[styles.optionName, { color: palette.text }]} numberOfLines={1}>
        {option.display_name}
      </Text>
      {!!option.username && (
        <Text style={[styles.optionUsername, { color: palette.textMuted }]} numberOfLines={1}>
          @{option.username}
        </Text>
      )}
    </View>
  );
});

// ---------- GuessGameModal ----------

const GuessGameModal: React.FC<GuessGameModalProps> = ({
  quote,
  visible,
  onClose,
  onGuess,
  theme,
  accent,
  milestoneMessage,
}) => {
  const styles = useThemedStyles(getModalStyles);
  const { width: screenWidth } = useWindowDimensions();
  const [pendingSelection, setPendingSelection] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const palette = useMemo<ModalPalette>(() => {
    const withAlpha = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    return {
      accent,
      accentSoft: withAlpha(accent, 0.10),
      accentMedium: withAlpha(accent, 0.18),
      text: theme.text,
      textMuted: theme.secondaryText,
      card: theme.cardBackground,
      bg: theme.modalBackground,
      border: theme.border,
      inputBg: theme.inputBackground,
      correct: '#34C759',
      correctSoft: 'rgba(52, 199, 89, 0.12)',
      incorrect: '#FF6B6B',
      incorrectSoft: 'rgba(255, 107, 107, 0.12)',
    };
  }, [accent, theme]);

  const successScale = useSharedValue(0);

  React.useEffect(() => {
    if (hasSubmitted && quote?.guess?.correct) {
      successScale.value = withSpring(1, {
        damping: 16,
        stiffness: 260,
        overshootClamping: true,
      });
    }
  }, [hasSubmitted, quote?.guess?.correct, successScale]);

  const badgeSpringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const handleConfirm = () => {
    if (pendingSelection === null) return;
    setSelectedOption(pendingSelection);
    onGuess(pendingSelection);
    setHasSubmitted(true);
  };

  const handleSkip = () => {
    onGuess(undefined, true);
    setHasSubmitted(true);
  };

  const correctId = quote?.quoted_user?.id ?? null;
  const isPostGuess = hasSubmitted || !!quote?.guess;
  const isWaitingForResult =
    isPostGuess && quote?.guess?.correct === null && !quote?.guess?.skipped;

  const optionWidth = (screenWidth - 32 - 10) / 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          {/* Grabber + close */}
          <View style={styles.header}>
            <View style={styles.grabber} />
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
              hitSlop={8}
            >
              <View style={[styles.closeBtnCircle, { backgroundColor: palette.inputBg }]}>
                <IconSymbol name="xmark" size={12} color={palette.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Quote card */}
            <Animated.View entering={FadeIn.delay(60).duration(320)} style={styles.quoteCardWrap}>
              <View style={[styles.quoteCard, { backgroundColor: palette.card }]}>
                <Text style={[styles.quotePrompt, { color: palette.textMuted }]}>
                  WHO SAID THIS?
                </Text>
                <Text style={[styles.quoteText, { color: palette.text }]} selectable>
                  &ldquo;{quote.text}&rdquo;
                </Text>
              </View>
            </Animated.View>

            {/* ---- Pre-guess state ---- */}
            {!isPostGuess && (
              <>
                <View style={styles.grid}>
                  {quote.guess_options?.map((option, i) => (
                    <OptionTile
                      key={option.id}
                      option={option}
                      index={i}
                      isPending={pendingSelection === option.id}
                      optionWidth={optionWidth}
                      palette={palette}
                      onSelect={setPendingSelection}
                    />
                  ))}
                </View>

                {pendingSelection !== null ? (
                  <Animated.View
                    entering={FadeInUp.duration(200)}
                    style={styles.confirmArea}
                  >
                    <TouchableOpacity
                      onPress={handleConfirm}
                      activeOpacity={0.85}
                      style={[styles.confirmBtn, { backgroundColor: palette.accent }]}
                    >
                      <Text style={styles.confirmBtnText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSkip}
                      activeOpacity={0.7}
                      style={styles.skipBtn}
                    >
                      <IconSymbol name="forward.fill" size={12} color={palette.textMuted} />
                      <Text style={[styles.skipLabel, { color: palette.textMuted }]}>Skip instead</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeIn.delay(400).duration(300)} style={styles.skipWrap}>
                    <TouchableOpacity
                      onPress={handleSkip}
                      activeOpacity={0.7}
                      style={styles.skipBtn}
                    >
                      <IconSymbol name="forward.fill" size={12} color={palette.textMuted} />
                      <Text style={[styles.skipLabel, { color: palette.textMuted }]}>Skip</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </>
            )}

            {/* ---- Waiting for result ---- */}
            {isWaitingForResult && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.checkingWrap}>
                <View style={[styles.resultPill, { backgroundColor: palette.accentSoft }]}>
                  <ActivityIndicator size="small" color={palette.accent} />
                  <Text style={[styles.resultLabel, { color: palette.text }]}>Checking...</Text>
                </View>
              </Animated.View>
            )}

            {/* ---- Result state ---- */}
            {isPostGuess && !isWaitingForResult && (
              <>
                {/* Result banner */}
                <Animated.View
                  entering={FadeIn.duration(220)}
                  style={styles.resultWrap}
                >
                  <Animated.View
                    style={[
                      styles.resultPill,
                      {
                        backgroundColor: quote.guess?.skipped
                          ? palette.accentSoft
                          : quote.guess?.correct
                          ? palette.correctSoft
                          : palette.incorrectSoft,
                      },
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
                      size={22}
                      color={
                        quote.guess?.skipped
                          ? palette.accent
                          : quote.guess?.correct
                          ? palette.correct
                          : palette.incorrect
                      }
                    />
                    <Text
                      style={[
                        styles.resultLabel,
                        {
                          color: quote.guess?.skipped
                            ? palette.text
                            : quote.guess?.correct
                            ? palette.correct
                            : palette.incorrect,
                        },
                      ]}
                    >
                      {quote.guess?.skipped
                        ? 'Skipped'
                        : quote.guess?.correct
                        ? 'Correct!'
                        : `Nope — it was ${quote.quoted_user?.display_name ?? quote.quoted_name}`}
                    </Text>
                  </Animated.View>
                  <BurstParticles color={palette.correct} active={!!quote.guess?.correct} />
                </Animated.View>

                {/* Locked grid */}
                <View style={styles.grid}>
                  {quote.guess_options?.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrect = correctId != null && option.id === correctId;
                    const isWrong = isSelected && !quote?.guess?.correct && !isCorrect;
                    return (
                      <LockedTile
                        key={option.id}
                        option={option}
                        optionWidth={optionWidth}
                        isCorrect={isCorrect}
                        isWrong={isWrong}
                        palette={palette}
                      />
                    );
                  })}
                </View>

                {quote.guess?.correct && milestoneMessage && (
                  <Animated.View
                    entering={FadeInDown.delay(350).duration(400).springify()}
                    style={styles.milestoneWrap}
                  >
                    <Text style={[styles.milestoneText1, { color: palette.text }]}>
                      {milestoneMessage.text1}
                    </Text>
                    <Text style={[styles.milestoneText2, { color: palette.textMuted }]}>
                      {milestoneMessage.text2}
                    </Text>
                  </Animated.View>
                )}

                {/* Done */}
                <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.doneWrap}>
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.85}
                    style={[styles.doneBtn, { backgroundColor: palette.accent }]}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default GuessGameModal;
