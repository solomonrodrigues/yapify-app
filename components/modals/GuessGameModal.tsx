import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Quote, MinimalUser } from '@/types/api';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, ProfileColorHexMapPastel, ProfileColorEnum } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
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
  textTertiary: string;
  inputBg: string;
  bg: string;
  correct: string;
  correctSoft: string;
  correctMedium: string;
  incorrect: string;
  incorrectSoft: string;
  incorrectMedium: string;
};

// ---------- Styles ----------

const getModalStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },

    // ---- Header ----
    header: {
      paddingTop: 12,
      paddingBottom: 16,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    grabber: {
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.border,
      marginBottom: 14,
    },
    headerTitle: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1.4,
    },
    closeBtn: {
      position: 'absolute',
      right: 16,
      top: 10,
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
      marginHorizontal: 16,
      marginBottom: 24,
      borderRadius: 20,
      borderCurve: 'continuous',
      overflow: 'hidden',
      flexDirection: 'row',
    },
    quoteAccentStrip: {
      width: 4,
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
    },
    quoteCardBody: {
      flex: 1,
      paddingVertical: 22,
      paddingHorizontal: 20,
      paddingLeft: 18,
    },
    quoteText: {
      fontSize: 21,
      lineHeight: 31,
      fontFamily: 'Lora',
      letterSpacing: 0.2,
    },
    quoteContext: {
      fontSize: 13,
      fontWeight: '500',
      marginTop: 10,
      fontStyle: 'italic',
    },

    // ---- Options list ----
    optionsList: {
      paddingHorizontal: 16,
      gap: 10,
    },
    optionTile: {
      borderRadius: 18,
      borderCurve: 'continuous',
      borderWidth: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
    },
    optionColorStrip: {
      width: 4,
      alignSelf: 'stretch',
    },
    optionContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingLeft: 14,
      paddingRight: 16,
      gap: 14,
    },
    optionTextCol: {
      flex: 1,
    },
    optionName: {
      fontSize: 15,
      fontWeight: '600',
    },
    optionUsername: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },
    selectionIndicator: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
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
    },

    // ---- Actions ----
    actionsWrap: {
      paddingHorizontal: 16,
      marginTop: 20,
      gap: 12,
    },
    confirmBtn: {
      paddingVertical: 15,
      borderRadius: 999,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    confirmBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    skipBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
    },
    skipLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    skipHint: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },

    // ---- Checking ----
    checkingWrap: {
      paddingHorizontal: 16,
      marginTop: 24,
      marginBottom: 8,
    },
    checkingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 14,
      borderRadius: 16,
    },
    checkingLabel: {
      fontSize: 15,
      fontWeight: '600',
    },

    // ---- Result banner ----
    resultBannerWrap: {
      marginHorizontal: 16,
      marginBottom: 20,
      borderRadius: 20,
      borderCurve: 'continuous',
      overflow: 'hidden',
      flexDirection: 'row',
    },
    resultStrip: {
      width: 4,
    },
    resultBannerBody: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 18,
      gap: 14,
    },
    resultIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultTextCol: {
      flex: 1,
    },
    resultHeadline: {
      fontSize: 17,
      fontWeight: '700',
    },
    resultSubtitle: {
      fontSize: 13,
      fontWeight: '500',
      marginTop: 2,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    streakBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },

    // ---- Milestone ----
    milestoneWrap: {
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      borderCurve: 'continuous',
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    milestoneTextCol: {
      flex: 1,
    },
    milestoneText1: {
      fontSize: 15,
      fontWeight: '700',
    },
    milestoneText2: {
      fontSize: 13,
      fontWeight: '500',
      marginTop: 2,
    },

    // ---- Done ----
    doneWrap: {
      paddingHorizontal: 16,
      marginTop: 20,
    },
    doneBtn: {
      paddingVertical: 15,
      borderRadius: 999,
      alignItems: 'center',
    },
    doneBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
  });

// ---------- OptionTile ----------

interface OptionTileProps {
  option: MinimalUser;
  index: number;
  isPending: boolean;
  palette: ModalPalette;
  onSelect: (id: number | null) => void;
}

const OptionTile = React.memo<OptionTileProps>(({
  option, index, isPending, palette, onSelect,
}) => {
  const styles = useThemedStyles(getModalStyles);
  const profileColor = ProfileColorHexMapPastel[option.profile_color as ProfileColorEnum] ?? palette.accent;

  return (
    <Animated.View
      entering={FadeInRight.delay(80 + index * 70).duration(280).springify()}
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
        <View style={[styles.optionColorStrip, { backgroundColor: profileColor, opacity: isPending ? 0.7 : 0.5 }]} />
        <View style={styles.optionContent}>
          <InitialsAvatar user={option} size={44} defaultBorder={false} />
          <View style={styles.optionTextCol}>
            <Text style={[styles.optionName, { color: palette.text }]} numberOfLines={1}>
              {option.display_name}
            </Text>
            {!!option.username && (
              <Text style={[styles.optionUsername, { color: palette.textMuted }]} numberOfLines={1}>
                @{option.username}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.selectionIndicator,
              {
                borderColor: isPending ? palette.accent : palette.border,
                backgroundColor: isPending ? palette.accent : 'transparent',
              },
            ]}
          >
            {isPending && (
              <Animated.View entering={ZoomIn.duration(150)}>
                <IconSymbol name="checkmark" size={11} color="#fff" />
              </Animated.View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ---------- LockedTile ----------

interface LockedTileProps {
  option: MinimalUser;
  isCorrect: boolean;
  isWrong: boolean;
  palette: ModalPalette;
}

const LockedTile = React.memo<LockedTileProps>(({
  option, isCorrect, isWrong, palette,
}) => {
  const styles = useThemedStyles(getModalStyles);
  const profileColor = ProfileColorHexMapPastel[option.profile_color as ProfileColorEnum] ?? palette.accent;

  const tileBg = isCorrect ? palette.correctSoft : isWrong ? palette.incorrectSoft : palette.card;
  const tileBorder = isCorrect ? palette.correct : isWrong ? palette.incorrect : palette.border;
  const stripColor = isCorrect ? palette.correct : isWrong ? palette.incorrect : profileColor;
  const stripOpacity = isCorrect || isWrong ? 1 : 0.3;
  const textOpacity = isCorrect || isWrong ? 1 : 0.45;

  return (
    <View
      style={[styles.optionTile, { backgroundColor: tileBg, borderColor: tileBorder, opacity: 1 }]}
      pointerEvents="none"
    >
      <View style={[styles.optionColorStrip, { backgroundColor: stripColor, opacity: stripOpacity }]} />
      <View style={[styles.optionContent, { opacity: textOpacity }]}>
        <View style={styles.lockedAvatarWrap}>
          <InitialsAvatar user={option} size={44} defaultBorder={false} />
          {isCorrect && (
            <Animated.View
              entering={ZoomIn.delay(180).springify()}
              style={[styles.avatarBadge, { backgroundColor: palette.correct, borderColor: tileBg }]}
            >
              <IconSymbol name="checkmark" size={9} color="#fff" />
            </Animated.View>
          )}
          {isWrong && (
            <Animated.View
              entering={ZoomIn.delay(180).springify()}
              style={[styles.avatarBadge, { backgroundColor: palette.incorrect, borderColor: tileBg }]}
            >
              <IconSymbol name="xmark" size={9} color="#fff" />
            </Animated.View>
          )}
        </View>
        <View style={styles.optionTextCol}>
          <Text style={[styles.optionName, { color: isCorrect ? palette.correct : isWrong ? palette.incorrect : palette.text }]} numberOfLines={1}>
            {option.display_name}
          </Text>
          {!!option.username && (
            <Text style={[styles.optionUsername, { color: palette.textMuted }]} numberOfLines={1}>
              @{option.username}
            </Text>
          )}
        </View>
      </View>
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
      accentMedium: withAlpha(accent, 0.16),
      text: theme.text,
      textMuted: theme.secondaryText,
      textTertiary: theme.tertiaryText,
      card: theme.cardBackground,
      bg: theme.modalBackground,
      border: theme.border,
      inputBg: theme.inputBackground,
      correct: '#34C759',
      correctSoft: 'rgba(52, 199, 89, 0.10)',
      correctMedium: 'rgba(52, 199, 89, 0.20)',
      incorrect: '#FF6B6B',
      incorrectSoft: 'rgba(255, 107, 107, 0.10)',
      incorrectMedium: 'rgba(255, 107, 107, 0.20)',
    };
  }, [accent, theme]);

  const successScale = useSharedValue(0);

  React.useEffect(() => {
    if (hasSubmitted && quote?.guess?.correct) {
      successScale.value = withSpring(1, { damping: 16, stiffness: 260, overshootClamping: true });
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
  const isWaitingForResult = isPostGuess && quote?.guess?.correct === null && !quote?.guess?.skipped;
  const remainingSkips = quote?.remaining_skips ?? 0;

  const resultIsCorrect = !isWaitingForResult && !!quote?.guess?.correct;
  const resultIsSkipped = !isWaitingForResult && !!quote?.guess?.skipped;
  const resultIsWrong = !isWaitingForResult && isPostGuess && !resultIsCorrect && !resultIsSkipped;

  const currentStreak = quote?.guess?.current_streak ?? 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.grabber} />
            <Text style={[styles.headerTitle, { color: palette.textMuted }]}>
              WHO SAID THIS?
            </Text>
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
            <Animated.View entering={FadeIn.delay(60).duration(280)} style={styles.quoteCardWrap}>
              <View style={[styles.quoteAccentStrip, { backgroundColor: accent }]} />
              <View style={[styles.quoteCardBody, { backgroundColor: palette.card }]}>
                <Text style={[styles.quoteText, { color: palette.text }]} selectable>
                  &ldquo;{quote.text}&rdquo;
                </Text>
                {!!quote.context && (
                  <Text style={[styles.quoteContext, { color: palette.textMuted }]}>
                    {quote.context}
                  </Text>
                )}
              </View>
            </Animated.View>

            {/* ---- Pre-guess state ---- */}
            {!isPostGuess && (
              <>
                <View style={styles.optionsList}>
                  {quote.guess_options?.map((option, i) => (
                    <OptionTile
                      key={option.id}
                      option={option}
                      index={i}
                      isPending={pendingSelection === option.id}
                      palette={palette}
                      onSelect={setPendingSelection}
                    />
                  ))}
                </View>

                <Animated.View entering={FadeIn.delay(400).duration(280)} style={styles.actionsWrap}>
                  {pendingSelection !== null ? (
                    <Animated.View entering={FadeIn.duration(180)}>
                      <TouchableOpacity
                        onPress={handleConfirm}
                        activeOpacity={0.85}
                        style={[styles.confirmBtn, { backgroundColor: palette.accent }]}
                      >
                        <Text style={styles.confirmBtnText}>Lock it in</Text>
                        <IconSymbol name="chevron.right" size={14} color="#fff" />
                      </TouchableOpacity>
                    </Animated.View>
                  ) : null}
                  <TouchableOpacity
                    onPress={handleSkip}
                    activeOpacity={0.7}
                    style={styles.skipBtn}
                  >
                    <IconSymbol name="forward.fill" size={12} color={palette.textMuted} />
                    <View>
                      <Text style={[styles.skipLabel, { color: palette.textMuted }]}>
                        {pendingSelection !== null ? 'Skip instead' : 'Skip'}
                      </Text>
                      {remainingSkips <= 2 && (
                        <Text style={[styles.skipHint, { color: palette.textTertiary }]}>
                          {remainingSkips} skip{remainingSkips !== 1 ? 's' : ''} left this week
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            {/* ---- Waiting for result ---- */}
            {isWaitingForResult && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.checkingWrap}>
                <View style={[styles.checkingPill, { backgroundColor: palette.accentSoft }]}>
                  <ActivityIndicator size="small" color={palette.accent} />
                  <Text style={[styles.checkingLabel, { color: palette.text }]}>Checking...</Text>
                </View>
              </Animated.View>
            )}

            {/* ---- Result state ---- */}
            {isPostGuess && !isWaitingForResult && (
              <>
                {/* Result banner */}
                <Animated.View
                  entering={FadeInDown.duration(300).springify()}
                  style={styles.resultBannerWrap}
                >
                  <View
                    style={[
                      styles.resultStrip,
                      {
                        backgroundColor: resultIsCorrect
                          ? palette.correct
                          : resultIsWrong
                          ? palette.incorrect
                          : palette.accent,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.resultBannerBody,
                      {
                        backgroundColor: resultIsCorrect
                          ? palette.correctSoft
                          : resultIsWrong
                          ? palette.incorrectSoft
                          : palette.accentSoft,
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.resultIconWrap,
                        {
                          backgroundColor: resultIsCorrect
                            ? palette.correctMedium
                            : resultIsWrong
                            ? palette.incorrectMedium
                            : palette.accentMedium,
                        },
                        resultIsCorrect ? badgeSpringStyle : null,
                      ]}
                    >
                      <IconSymbol
                        name={
                          resultIsSkipped
                            ? 'forward.fill'
                            : resultIsCorrect
                            ? 'checkmark.seal.fill'
                            : 'xmark.octagon'
                        }
                        size={22}
                        color={
                          resultIsSkipped
                            ? palette.accent
                            : resultIsCorrect
                            ? palette.correct
                            : palette.incorrect
                        }
                      />
                    </Animated.View>

                    <View style={styles.resultTextCol}>
                      <Text
                        style={[
                          styles.resultHeadline,
                          {
                            color: resultIsCorrect
                              ? palette.correct
                              : resultIsWrong
                              ? palette.incorrect
                              : palette.text,
                          },
                        ]}
                      >
                        {resultIsSkipped
                          ? 'Skipped'
                          : resultIsCorrect
                          ? 'Correct!'
                          : 'Nope!'}
                      </Text>
                      {resultIsWrong && (
                        <Text style={[styles.resultSubtitle, { color: palette.textMuted }]}>
                          It was {quote.quoted_user?.display_name ?? quote.quoted_name}
                        </Text>
                      )}
                      {resultIsCorrect && currentStreak > 1 && (
                        <View style={[styles.streakBadge, { backgroundColor: palette.correctMedium }]}>
                          <IconSymbol name="flame.fill" size={12} color={palette.correct} />
                          <Text style={[styles.streakBadgeText, { color: palette.correct }]}>
                            {currentStreak} in a row
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>

                <BurstParticles color={palette.correct} active={resultIsCorrect} />

                {/* Locked tiles */}
                <View style={styles.optionsList}>
                  {quote.guess_options?.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isCorrect = correctId != null && option.id === correctId;
                    const isWrong = isSelected && !quote?.guess?.correct && !isCorrect;
                    return (
                      <LockedTile
                        key={option.id}
                        option={option}
                        isCorrect={isCorrect}
                        isWrong={isWrong}
                        palette={palette}
                      />
                    );
                  })}
                </View>

                {/* Milestone */}
                {resultIsCorrect && milestoneMessage && (
                  <Animated.View
                    entering={FadeInDown.delay(350).duration(350).springify()}
                    style={[styles.milestoneWrap, { backgroundColor: palette.accentSoft }]}
                  >
                    <IconSymbol name="trophy.fill" size={20} color={palette.accent} />
                    <View style={styles.milestoneTextCol}>
                      <Text style={[styles.milestoneText1, { color: palette.text }]}>
                        {milestoneMessage.text1}
                      </Text>
                      <Text style={[styles.milestoneText2, { color: palette.textMuted }]}>
                        {milestoneMessage.text2}
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {/* Done */}
                <Animated.View entering={FadeIn.delay(280).duration(280)} style={styles.doneWrap}>
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
