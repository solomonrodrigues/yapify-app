import FeedQuote from '@/components/FeedQuote';
import { FriendButton } from '@/components/FriendButton';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useQuotesFeed } from '@/hooks/useQuotesFeed';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getUser, getUserFriends } from '@/lib/api/friends';
import type { User as CurrentUser, Friendship, PublicUser, Quote } from '@/types/api';
import { LegendList } from '@legendapp/list';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const isOwnProfile = !userId || userId === currentUser.id;
  
  // State
  const [user, setUser] = useState<ProfileUser | null>(isOwnProfile ? currentUser : null);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [activeTab, setActiveTab] = useState<TabType>('posted');
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  
  // Friends modal state
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [friendsNextUrl, setFriendsNextUrl] = useState<string | null>(null);
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [hasMoreFriends, setHasMoreFriends] = useState(true);
  const [refreshingFriends, setRefreshingFriends] = useState(false);

  // Animation refs for pulse effect
  const postedPulseAnim = useRef(new Animated.Value(1)).current;
  const receivedPulseAnim = useRef(new Animated.Value(1)).current;

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

  const { quotes, refreshing, isLoadingMore, refreshQuotes, loadMore, likeQuoteById, witnessQuoteById, guessQuoteById } = useQuotesFeed({
    scope: { type: 'user', id: userId ?? currentUser.id },
  });

  // Load friends
  const loadFriends = useCallback(
    async ({
      url,
      search,
      refresh = false,
    }: {
      url?: string | null;
      search?: string;
      refresh?: boolean;
    } = {}) => {
      if (!user) return;

      if (refresh) {
        setRefreshingFriends(true);
      } else {
        setLoadingFriends(true);
      }

      try {
        // If this is a fresh load (no pagination url), reset pagination cursors
        if (!url) {
          setFriendsNextUrl(null);
        }

        const data = await getUserFriends(
          user.id,
          url ? { url } : { search }
        );

        if (refresh || !url) {
          setFriends(data.results);
        } else {
          setFriends((prev) => [...prev, ...data.results]);
        }

        setFriendsNextUrl(data.next ?? null);
        setHasMoreFriends(Boolean(data.next));
      } catch (error) {
        console.error("Failed to load friends:", error);
      } finally {
        setLoadingFriends(false);
        setRefreshingFriends(false);
      }
    },
    [user]
  );

  // Initial load of quotes
  useEffect(() => {
    if (user) {
      refreshQuotes();
    }
  }, []);

  // Handlers
  const handleLoadMoreFriends = () => {
    if (hasMoreFriends && !loadingFriends && friendsNextUrl) {
      loadFriends({ url: friendsNextUrl });
    }
  };

  const handleRefreshPosted = () => {
    refreshQuotes();
  };

  const handleRefreshReceived = () => {
    refreshQuotes();
  };

  const handleRefreshFriends = () => {
    loadFriends({ refresh: true, search: friendsSearchQuery || undefined });
  };

  const handleOpenFriends = () => {
    setFriendsModalVisible(true);
    if (friends.length === 0) {
      loadFriends({ search: friendsSearchQuery || undefined });
    }
  };

  const handleFriendsSearchChange = (text: string) => {
    setFriendsSearchQuery(text);
    loadFriends({ search: text, refresh: true });
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

  const renderFriendItem = ({ item }: { item: PublicUser }) => (
    <TouchableOpacity style={styles.friendItem} activeOpacity={0.7}>
      <InitialsAvatar user={item} size={48} />
      <View style={styles.friendInfo}>
        <ThemedText style={styles.friendName}>{item.display_name}</ThemedText>
        <ThemedText style={styles.friendUsername}>@{item.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

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

  const friendsCount = 'friends_count' in user ? user.friends_count : '0';
  const quotesPostedCount = 'total_quotes_posted' in user 
    ? user.total_quotes_posted 
    : parseInt(('quotes_count' in user && user.quotes_count) || '0');
  const quotesReceivedCount = 'total_quotes_received' in user ? user.total_quotes_received : 0;

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
            style={[styles.tab, activeTab === 'posted' && styles.tabActive]}
            onPress={() => handleTabChange('posted')}
          >
            <Animated.View style={{ transform: [{ scale: postedPulseAnim }] }}>
              <ThemedText style={[styles.tabText, activeTab === 'posted' && styles.tabTextActive]}>
                Posted
              </ThemedText>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.tabActive]}
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
        <Modal
          visible={friendsModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setFriendsModalVisible(false)}
        >
          <ThemedView style={styles.modalContainer}>
            <SafeAreaView edges={['top', 'bottom']} style={styles.modalSafeArea}>
              <View style={styles.modalHeader}>
                <ThemedText type="title">Friends</ThemedText>
                <TouchableOpacity
                  onPress={() => setFriendsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.searchInput,
                  { borderColor: theme.divider, backgroundColor: theme.cardBackground, color: theme.text },
                ]}
                placeholder="Search friends"
                placeholderTextColor={theme.secondaryText}
                value={friendsSearchQuery}
                onChangeText={handleFriendsSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              <LegendList
                data={friends}
                keyExtractor={(item: PublicUser) => item.id.toString()}
                renderItem={renderFriendItem}
                refreshing={refreshingFriends}
                onRefresh={handleRefreshFriends}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.friendsList}
                onEndReached={handleLoadMoreFriends}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter(loadingFriends)}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>No friends yet</ThemedText>
                  </View>
                }
              />
            </SafeAreaView>
          </ThemedView>
        </Modal>
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
    tabActive: {
      borderBottomColor: theme.pastels.purple,
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
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 24,
      color: theme.text,
    },
    searchInput: {
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      fontSize: 15,
    },
    friendsList: {
      padding: 16,
    },
    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: theme.cardBackground,
    },
    friendInfo: {
      marginLeft: 12,
      flex: 1,
    },
    friendName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    friendUsername: {
      fontSize: 14,
      color: theme.secondaryText,
      marginTop: 2,
    },
  });

export default UnifiedProfile;
