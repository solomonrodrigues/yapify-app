import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Quote } from '@/types/api';
import { useQuotes } from '@/context/QuotesContext';
import { useGroups } from '@/context/GroupsContext';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegendList } from '@legendapp/list';
import FeedQuote from '@/components/FeedQuote';
import { useFeedFilter } from '@/context/FeedFilterContext';
import { IconSymbol, type IconSymbolName } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';


// Group pill switcher at the top of the feed
const GroupPills: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { groups, currentGroup, setCurrentGroup } = useGroups();
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={pillStyles.container}
      style={{ flexGrow: 0 }}
    >
      {groups.length > 0 && (
        <TouchableOpacity
          style={[pillStyles.pill, currentGroup === null && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          onPress={() => setCurrentGroup(null)}
        >
          <Text style={[pillStyles.pillText, { color: currentGroup === null ? '#fff' : theme.secondaryText }]}>
            All
          </Text>
        </TouchableOpacity>
      )}
      {groups.map((group) => {
        const active = currentGroup?.id === group.id;
        return (
          <TouchableOpacity
            key={group.id}
            style={[pillStyles.pill, { borderColor: active ? theme.accent : theme.border }, active && { backgroundColor: theme.accent }]}
            onPress={() => active
              ? router.push({ pathname: '/groups/[groupId]/settings', params: { groupId: group.id.toString() } })
              : setCurrentGroup(group)
            }
          >
            <Text style={[pillStyles.pillText, { color: active ? '#fff' : theme.text }]} numberOfLines={1}>
              {group.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={[pillStyles.pill, pillStyles.createPill, { borderColor: theme.border }]}
        onPress={() => router.push('/groups/create')}
      >
        <IconSymbol name="plus" size={14} color={theme.secondaryText} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const pillStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  createPill: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

// Main Feed Component
const QuotesFeed: React.FC = () => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { quotes, refreshing, isLoadingMore, hasMore, error, hasLoadedOnce, refreshQuotes, loadMore, likeQuoteById, witnessQuoteById, guessQuoteById, saveQuoteById, unsaveQuoteById, unhideQuoteById, respondToQuoteById } = useQuotes();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? 0 : 16;
  const { filter } = useFeedFilter();
  const { groups } = useGroups();
  const router = useRouter();

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  // Empty state messages based on filter
  const getEmptyMessage = () => {
    if (groups.length === 0) {
      return "Create a group and invite friends to start sharing quotes.";
    }
    switch (filter) {
      case 'guessable':
        return "All caught up on guesses!\nCheck back when your group posts more.";
      case 'respondable':
        return "Nothing waiting for your response.";
      default:
        return "Start quoting your group's funniest moments.";
    }
  };

  const getEmptyIcon = (): IconSymbolName => {
    switch (filter) {
      case 'guessable':
        return 'person.fill.viewfinder';
      case 'respondable':
        return 'bubble.left.fill';
      default:
        return 'quote.bubble';
    }
  };

  if (!hasLoadedOnce && error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Text style={styles.emptyText}>{"Couldn't load quotes"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshQuotes}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <View
        style={{
          flex: 1,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
        }}
      >
        <GroupPills />
        <LegendList
          data={quotes}
          keyExtractor={(item: Quote) => item.id.toString()}
          renderItem={({ item, index }) => (
            <FeedQuote
              quote={item}
              theme={theme}
              index={index}
              onLike={likeQuoteById}
              onWitness={witnessQuoteById}
              onGuess={guessQuoteById}
              onSave={saveQuoteById}
              onUnsave={unsaveQuoteById}
              onUnhide={unhideQuoteById}
              onRespond={respondToQuoteById}
            />
          )}
          refreshing={refreshing}
          onRefresh={refreshQuotes}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.feedContainer, quotes.length === 0 && styles.emptyListContent]}
          style={{ paddingTop: paddingTop }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol
                name={getEmptyIcon()}
                size={48}
                color={theme.secondaryText}
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
              {filter === 'latest' && groups.length === 0 && (
                <TouchableOpacity style={styles.inviteButton} onPress={() => router.push('/groups/create')}>
                  <IconSymbol name="person.3.fill" size={16} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={styles.inviteText}>Create a Group</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </ThemedView>
  );
};

export const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    feedContainer: {
      paddingBottom: 48,
      flexGrow: 1,
    },
    emptyListContent: {
      justifyContent: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    emptyText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
      color: theme.secondaryText,
    },
    retryButton: {
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderColor: theme.accent,
    },
    retryText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.accent,
    },
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderColor: theme.accent,
    },
    inviteText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.accent,
    },
    loadingFooter: {
      padding: 20,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.secondaryText,
    },
  }
);

export default QuotesFeed;
