import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getQuoteGuesses } from '@/lib/api/quotes';
import type { QuoteGuessListItem, MinimalUser } from '@/types/api';

interface GuessesModalProps {
  visible: boolean;
  onClose: () => void;
  quoteId: number;
  quotedUser?: MinimalUser | null;
  onUserPress?: (userId: number) => void;
}

interface GuessSection {
  title: string;
  data: QuoteGuessListItem[];
}

const GuessesModal: React.FC<GuessesModalProps> = ({
  visible,
  onClose,
  quoteId,
  quotedUser,
  onUserPress,
}) => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [guesses, setGuesses] = useState<QuoteGuessListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  const loadGuesses = useCallback(
    async ({ url, refresh = false }: { url?: string | null; refresh?: boolean } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else if (!url) {
        setLoading(true);
      }

      try {
        const data = await getQuoteGuesses(quoteId, url);

        if (refresh || !url) {
          setGuesses(data.results);
        } else {
          setGuesses((prev) => [...prev, ...data.results]);
        }

        setNextUrl(data.next ?? null);
      } catch (error) {
        console.error('Failed to load guesses:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [quoteId]
  );

  useEffect(() => {
    if (visible) {
      loadGuesses({ refresh: true });
    }
  }, [visible, loadGuesses]);

  const handleLoadMore = () => {
    if (nextUrl && !loading) {
      loadGuesses({ url: nextUrl });
    }
  };

  const handleRefresh = () => {
    loadGuesses({ refresh: true });
  };

  // Group guesses by friendship status
  const sections: GuessSection[] = useMemo(() => {
    const friends: QuoteGuessListItem[] = [];
    const others: QuoteGuessListItem[] = [];

    guesses.forEach((guess) => {
      if (guess.friendship_status === 'accepted') {
        friends.push(guess);
      } else {
        others.push(guess);
      }
    });

    const result: GuessSection[] = [];
    if (friends.length > 0) {
      result.push({ title: 'Friends', data: friends });
    }
    if (others.length > 0) {
      result.push({ title: 'Others', data: others });
    }

    return result;
  }, [guesses]);

  const correctCount = guesses.filter((g) => g.correct === true).length;
  const incorrectCount = guesses.filter((g) => g.correct === false).length;
  const skippedCount = guesses.filter((g) => g.skipped).length;
  const totalGuesses = guesses.length;

  const renderGuessItem = ({ item, index }: { item: QuoteGuessListItem; index: number }) => {
    const isCorrect = item.correct === true;
    const isSkipped = item.skipped;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 300)).duration(300).springify()}>
        <TouchableOpacity
          style={styles.guessItem}
          activeOpacity={0.7}
          onPress={() => onUserPress?.(item.user.id)}
        >
          <InitialsAvatar user={item.user} size={42} />
          <View style={styles.guessInfo}>
            <ThemedText style={styles.guesserName}>{item.user.display_name}</ThemedText>
            <Text style={styles.guessDetail}>
              {isSkipped ? (
                <Text style={styles.skippedText}>Skipped</Text>
              ) : (
                <>
                  <Text style={styles.guessLabel}>Guessed </Text>
                  <Text style={styles.guessedName}>{item.guessed_user?.display_name || 'Unknown'}</Text>
                </>
              )}
            </Text>
          </View>
          <View style={styles.guessRight}>
            {isSkipped ? (
              <View style={[styles.resultBadge, styles.resultBadgeSkipped]}>
                <IconSymbol name="forward.fill" size={12} color={theme.secondaryText} />
              </View>
            ) : isCorrect ? (
              <View style={[styles.resultBadge, styles.resultBadgeCorrect]}>
                <IconSymbol name="checkmark" size={12} color="#fff" />
              </View>
            ) : (
              <View style={[styles.resultBadge, styles.resultBadgeIncorrect]}>
                <IconSymbol name="xmark" size={12} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSectionHeader = ({ section }: { section: GuessSection }) => (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
      <View style={styles.sectionCount}>
        <Text style={styles.sectionCountText}>{section.data.length}</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalSafeArea}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerCenter}>
              <View style={styles.grabber} />
              <ThemedText style={styles.headerTitle}>Guesses</ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <View style={styles.closeButtonCircle}>
                <IconSymbol name="xmark" size={12} color={theme.secondaryText} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Answer hint */}
          {quotedUser && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={styles.answerHint}>
                <InitialsAvatar user={quotedUser} size={28} />
                <View style={styles.answerInfo}>
                  <Text style={styles.answerHintLabel}>Answer</Text>
                  <Text style={styles.answerUserName}>{quotedUser.display_name}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Stats row */}
          {totalGuesses > 0 && (
            <Animated.View entering={FadeIn.delay(100).duration(300)}>
              <View style={styles.statsRow}>
                <View style={[styles.statPill, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
                  <IconSymbol name="checkmark" size={11} color="#34C759" />
                  <Text style={[styles.statPillText, { color: '#34C759', fontVariant: ['tabular-nums'] }]}>{correctCount}</Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: 'rgba(255, 107, 107, 0.12)' }]}>
                  <IconSymbol name="xmark" size={11} color="#FF6B6B" />
                  <Text style={[styles.statPillText, { color: '#FF6B6B', fontVariant: ['tabular-nums'] }]}>{incorrectCount}</Text>
                </View>
                {skippedCount > 0 && (
                  <View style={[styles.statPill, { backgroundColor: theme.inputBackground }]}>
                    <IconSymbol name="forward.fill" size={11} color={theme.secondaryText} />
                    <Text style={[styles.statPillText, { color: theme.secondaryText, fontVariant: ['tabular-nums'] }]}>{skippedCount}</Text>
                  </View>
                )}
                <View style={styles.statSpacer} />
                <Text style={[styles.totalText, { fontVariant: ['tabular-nums'] }]}>{totalGuesses} total</Text>
              </View>
            </Animated.View>
          )}

          {/* Loading state */}
          {loading && guesses.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={styles.loadingText}>Loading guesses...</ThemedText>
            </View>
          ) : guesses.length === 0 ? (
            <View style={styles.centerContainer}>
              <IconSymbol name="person.2" size={40} color={theme.border} />
              <ThemedText style={styles.emptyText}>No guesses yet</ThemedText>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderGuessItem}
              renderSectionHeader={renderSectionHeader}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
            />
          )}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
    },
    modalSafeArea: {
      flex: 1,
    },
    modalHeader: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 14,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.divider,
    },
    headerCenter: {
      alignItems: 'center',
    },
    grabber: {
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.border,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.text,
    },
    closeButton: {
      position: 'absolute',
      right: 16,
      top: 28,
    },
    closeButtonCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    answerHint: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 14,
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.cardBackground,
      gap: 12,
      borderCurve: 'continuous',
    },
    answerInfo: {
      flex: 1,
    },
    answerHintLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.secondaryText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    answerUserName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginTop: 1,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      gap: 8,
    },
    statPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      gap: 4,
    },
    statPillText: {
      fontSize: 13,
      fontWeight: '600',
    },
    statSpacer: {
      flex: 1,
    },
    totalText: {
      fontSize: 13,
      color: theme.secondaryText,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
      gap: 6,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 8,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.secondaryText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionCount: {
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    sectionCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.secondaryText,
    },
    guessItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.cardBackground,
      borderCurve: 'continuous',
    },
    guessInfo: {
      marginLeft: 12,
      flex: 1,
    },
    guesserName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    guessDetail: {
      fontSize: 13,
      marginTop: 2,
    },
    guessLabel: {
      color: theme.secondaryText,
    },
    guessedName: {
      color: theme.text,
      fontWeight: '500',
    },
    skippedText: {
      color: theme.secondaryText,
      fontStyle: 'italic',
    },
    guessRight: {
      marginLeft: 12,
    },
    resultBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultBadgeCorrect: {
      backgroundColor: '#34C759',
    },
    resultBadgeIncorrect: {
      backgroundColor: '#FF6B6B',
    },
    resultBadgeSkipped: {
      backgroundColor: theme.inputBackground,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: 12,
    },
    loadingText: {
      fontSize: 15,
      color: theme.secondaryText,
    },
    emptyText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.secondaryText,
    },
    loadingFooter: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

export default GuessesModal;
