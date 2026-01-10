import FeedQuote from '@/components/FeedQuote';
import { FriendButton } from '@/components/FriendButton';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { UserListModal } from '@/components/UserListModal';
import { Colors, ProfileColorHexMap } from '@/constants/Colors';
import { useQuotesFeed } from '@/hooks/useQuotesFeed';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getUser, getUserFriends } from '@/lib/api/friends';
import type { User as CurrentUser, Friendship, PublicUser, Quote, ProfileColorEnum } from '@/types/api';
import { LegendList } from '@legendapp/list';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type ProfileUser = CurrentUser | PublicUser;

type ProfileProps = {
  userId?: number; // If provided, show other user's profile. If not, show current user's profile
  currentUser: CurrentUser;
};

type TabType = 'posted' | 'received';

const UnifiedProfile: React.FC<ProfileProps> = ({
  userId,
  currentUser,
}) => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const isOwnProfile = !userId || userId === currentUser.id;

  // State
  const [user, setUser] = useState<ProfileUser | null>(isOwnProfile ? currentUser : null);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [activeTab, setActiveTab] = useState<TabType>('posted');
  const [friendship, setFriendship] = useState<Friendship | null>(null);

  // Friends modal state
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);

  // Animation refs for pulse effect
  const postedPulseAnim = useRef(new Animated.Value(1)).current;
  const receivedPulseAnim = useRef(new Animated.Value(1)).current;

  // Update user when currentUser changes (for own profile)
  useEffect(() => {
    if (isOwnProfile) {
      setUser(currentUser);
    }
  }, [currentUser, isOwnProfile]);

  // Load user profile
  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userData = await getUser(userId);
        setUser(userData);
        setFriendship(userData.friendship || null);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isOwnProfile && userId) {
      loadUser();
    }
  }, [userId, isOwnProfile]);

  // Separate feeds for posted and received quotes
  const postedFeed = useQuotesFeed({
    scope: { type: 'user-posted', id: userId ?? currentUser.id },
  });

  const receivedFeed = useQuotesFeed({
    scope: { type: 'user-received', id: userId ?? currentUser.id },
  });

  // Use the active tab's feed
  const activeFeed = activeTab === 'posted' ? postedFeed : receivedFeed;
  const { quotes, refreshing, isLoadingMore, loadMore, likeQuoteById, witnessQuoteById, guessQuoteById, unhideQuoteById } = activeFeed;

  // Friends fetcher for UserListModal
  const friendsFetcher = useCallback(
    async ({ url, search }: { url?: string | null; search?: string }): Promise<{ results: PublicUser[]; next: string | null }> => {
      if (!user) {
        return { results: [], next: null };
      }
      const result = await getUserFriends(user.id, url ? { url } : { search });
      return {
        results: result.results,
        next: result.next ?? null,
      };
    },
    [user]
  );

  // Initial load of quotes for both tabs
  useEffect(() => {
    if (user) {
      postedFeed.loadQuotes();
      receivedFeed.loadQuotes();
    }
  }, [user]);

  // Handlers
  const handleRefreshPosted = () => {
    postedFeed.refreshQuotes();
  };

  const handleRefreshReceived = () => {
    receivedFeed.refreshQuotes();
  };

  const handleOpenFriends = () => {
    setFriendsModalVisible(true);
  };

  const handleUserPress = (pressedUser: PublicUser) => {
    setFriendsModalVisible(false);
    router.push({ pathname: '/user/[userID]', params: { userID: String(pressedUser.id) } });
  };

  const handleFriendshipChange = (newFriendship: Friendship | null) => {
    setFriendship(newFriendship);
  };

  const triggerPulse = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'posted') {
      triggerPulse(postedPulseAnim);
    } else {
      triggerPulse(receivedPulseAnim);
    }
  };

  const renderFooter = (isLoading: boolean) => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.centerText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.centerText}>User not found</ThemedText>
      </ThemedView>
    );
  }

  // Handle both User (string) and PublicUser (number) types
  const friendsCount = user.friends_count;
  const quotesPostedCount = user.quotes_posted;
  const quotesReceivedCount = user.quotes_received;

  // Get user's profile color
  const userProfileColor = user.profile_color
    ? ProfileColorHexMap[user.profile_color as ProfileColorEnum]
    : theme.pastels.purple;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <InitialsAvatar user={user} size={80} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <ThemedText type="title">{user.display_name}</ThemedText>
            <ThemedText style={styles.username}>@{user.username}</ThemedText>
            {'bio' in user && user.bio && (
              <ThemedText style={styles.bio}>{user.bio}</ThemedText>
            )}
          </View>
        </View>

        {/* Friend Button (only for other users) */}
        {!isOwnProfile && (
          <View style={styles.actionContainer}>
            <FriendButton
              userId={user.id}
              friendship={friendship}
              onFriendshipChange={handleFriendshipChange}
              variant="default"
              showIcon={true}
            />
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => handleTabChange('posted')}
          >
            <ThemedText type="title">{quotesPostedCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Posted</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => handleTabChange('received')}
          >
            <ThemedText type="title">{quotesReceivedCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Received</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            activeOpacity={0.7}
            onPress={handleOpenFriends}
          >
            <ThemedText type="title">{friendsCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Friends</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'posted' && { borderBottomColor: userProfileColor },
            ]}
            onPress={() => handleTabChange('posted')}
          >
            <Animated.View style={{ transform: [{ scale: postedPulseAnim }] }}>
              <ThemedText style={[styles.tabText, activeTab === 'posted' && styles.tabTextActive]}>
                Posted
              </ThemedText>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'received' && { borderBottomColor: userProfileColor },
            ]}
            onPress={() => handleTabChange('received')}
          >
            <Animated.View style={{ transform: [{ scale: receivedPulseAnim }] }}>
              <ThemedText style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
                Received
              </ThemedText>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Quote Feed */}
        <View style={styles.feedContainer}>
          {activeTab === 'posted' ? (
            <LegendList
              data={quotes}
              keyExtractor={(item: Quote) => item.id.toString()}
              renderItem={({ item }) => (
                <FeedQuote
                  quote={item}
                  theme={theme}
                  onLike={likeQuoteById}
                  onWitness={witnessQuoteById}
                  onGuess={guessQuoteById}
                  onUnhide={unhideQuoteById}
                />
              )}
              refreshing={refreshing}
              onRefresh={handleRefreshPosted}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter(isLoadingMore)}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No quotes posted yet</ThemedText>
                </View>
              }
            />
          ) : (
            <LegendList
              data={quotes}
              keyExtractor={(item: Quote) => item.id.toString()}
              renderItem={({ item }) => (
                <FeedQuote
                  quote={item}
                  theme={theme}
                  onLike={likeQuoteById}
                  onWitness={witnessQuoteById}
                  onGuess={guessQuoteById}
                  onUnhide={unhideQuoteById}
                />
              )}
              refreshing={refreshing}
              onRefresh={handleRefreshReceived}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter(isLoadingMore)}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No quotes received yet</ThemedText>
                </View>
              }
            />
          )}
        </View>

        {/* Friends Modal */}
        <UserListModal
          visible={friendsModalVisible}
          onClose={() => setFriendsModalVisible(false)}
          title="Friends"
          fetcher={friendsFetcher}
          onUserPress={handleUserPress}
          searchable={true}
          emptyMessage="No friends yet"
        />
      </SafeAreaView>
    </ThemedView>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    centerText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.secondaryText,
    },
    header: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'flex-start',
    },
    headerAvatar: {
      marginRight: 16,
    },
    headerInfo: {
      flex: 1,
    },
    username: {
      color: theme.secondaryText,
      fontSize: 15,
      marginTop: 4,
    },
    bio: {
      color: theme.text,
      fontSize: 14,
      marginTop: 8,
      lineHeight: 20,
    },
    actionContainer: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
    },
    statLabel: {
      marginTop: 4,
      color: theme.secondaryText,
      fontSize: 13,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.secondaryText,
    },
    tabTextActive: {
      color: theme.text,
    },
    feedContainer: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 48,
    },
    quoteContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    quoteContent: {
      fontSize: 26,
      lineHeight: 34,
      color: theme.text,
      fontWeight: '300',
      letterSpacing: 0.3,
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
    emptyContainer: {
      padding: 48,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.secondaryText,
      textAlign: 'center',
    },
  });

export default UnifiedProfile;
