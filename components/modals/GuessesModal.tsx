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

  const renderGuessItem = ({ item }: { item: QuoteGuessListItem }) => {
    const isCorrect = item.correct === true;
    const isSkipped = item.skipped;

    return (
      <TouchableOpacity
        style={styles.guessItem}
        activeOpacity={0.7}
        onPress={() => onUserPress?.(item.user.id)}
      >
        <View style={styles.guessLeft}>
          <InitialsAvatar user={item.user} size={44} />
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
        </View>
        <View style={styles.guessRight}>
          {isSkipped ? (
            <View style={[styles.resultBadge, styles.resultBadgeSkipped]}>
              <IconSymbol name="forward.fill" size={14} color={theme.secondaryText} />
            </View>
          ) : isCorrect ? (
            <View style={[styles.resultBadge, styles.resultBadgeCorrect]}>
              <IconSymbol name="checkmark" size={14} color="#fff" />
            </View>
          ) : (
            <View style={[styles.resultBadge, styles.resultBadgeIncorrect]}>
              <IconSymbol name="xmark" size={14} color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
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

  const correctCount = guesses.filter((g) => g.correct === true).length;
  const totalGuesses = guesses.length;

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
            <View style={styles.headerLeft}>
              <ThemedText type="title">Guesses</ThemedText>
              {totalGuesses > 0 && (
                <Text style={styles.headerSubtitle}>
                  {correctCount}/{totalGuesses} correct
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>Done</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Answer hint */}
          {quotedUser && (
            <View style={styles.answerHint}>
              <Text style={styles.answerHintLabel}>Answer:</Text>
              <View style={styles.answerUser}>
                <InitialsAvatar user={quotedUser} size={24} />
                <Text style={styles.answerUserName}>{quotedUser.display_name}</Text>
              </View>
            </View>
          )}

          {/* Loading state */}
          {loading && guesses.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={styles.loadingText}>Loading guesses...</ThemedText>
            </View>
          ) : guesses.length === 0 ? (
            <View style={styles.centerContainer}>
              <IconSymbol name="person.2" size={48} color={theme.secondaryText} />
              <ThemedText style={styles.emptyText}>No guesses yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Be the first to guess who said this!
              </ThemedText>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    headerLeft: {
      flex: 1,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 2,
    },
    closeButton: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.accent,
    },
    answerHint: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    answerHintLabel: {
      fontSize: 14,
      color: theme.secondaryText,
      marginRight: 8,
    },
    answerUser: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    answerUserName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 12,
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
      backgroundColor: theme.border,
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
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: theme.cardBackground,
    },
    guessLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
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
      width: 28,
      height: 28,
      borderRadius: 14,
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
      backgroundColor: theme.border,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 15,
      color: theme.secondaryText,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 17,
      fontWeight: '600',
      color: theme.text,
    },
    emptySubtext: {
      marginTop: 6,
      fontSize: 14,
      color: theme.secondaryText,
      textAlign: 'center',
    },
    loadingFooter: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

export default GuessesModal;
