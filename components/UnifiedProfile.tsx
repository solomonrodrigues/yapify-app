import FeedQuote from '@/components/FeedQuote';
import { FriendButton } from '@/components/FriendButton';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserListModal } from '@/components/UserListModal';
import { Colors, ProfileColorHexMap } from '@/constants/Colors';
import { useBlockedUsers } from '@/context/BlockedUsersContext';
import { useQuotes } from '@/context/QuotesContext';
import { useQuotesFeed } from '@/hooks/useQuotesFeed';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getUser, getUserFriends } from '@/lib/api/friends';
import { reportUser, unreportUser } from '@/lib/api/users';
import { getErrorMessage } from '@/lib/utils/error';
import { hexToRgba } from '@/lib/utils/style';
import type { User as CurrentUser, Friendship, PublicUser, Quote, ProfileColorEnum, ReportReasonEnum } from '@/types/api';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    LayoutChangeEvent,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import ReAnimated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
    withSequence,
    withTiming,
    withSpring,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useNavigation, useRouter } from 'expo-router';

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
  const navigation = useNavigation();
  const isOwnProfile = !userId || userId === currentUser.id;
  const { blockUserById } = useBlockedUsers();
  const { removeQuotesInvolvingUser } = useQuotes();

  // State
  const [user, setUser] = useState<ProfileUser | null>(isOwnProfile ? currentUser : null);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posted');
  const [friendship, setFriendship] = useState<Friendship | null>(null);

  // Friends modal state
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);

  // Sticky header state
  const [headerHeight, setHeaderHeight] = useState(0);
  const [stickyTabsInteractive, setStickyTabsInteractive] = useState(false);
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const scrollY = useSharedValue(0);

  // Animation refs for pulse effect
  const postedPulseAnim = useRef(new Animated.Value(1)).current;
  const receivedPulseAnim = useRef(new Animated.Value(1)).current;

  // Avatar spin animation
  const avatarRotation = useSharedValue(0);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${avatarRotation.value}deg` }],
  }));

  const handleAvatarPress = () => {
    // Wind up (rotate backwards), then spin forward with spring
    avatarRotation.value = withSequence(
      // Wind up: rotate backwards 30 degrees
      withTiming(-30, { duration: 150, easing: Easing.out(Easing.quad) }),
      // Spin forward: full rotation plus overshoot
      withSpring(360, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      }),
      // Reset to 0 for next tap
      withTiming(0, { duration: 0 })
    );
  };

  // Update user when currentUser changes (for own profile)
  useEffect(() => {
    if (isOwnProfile) {
      setUser(currentUser);
    }
  }, [currentUser, isOwnProfile]);

  // Update navigation header based on scroll and profile type
  useEffect(() => {
    const options: { headerTitle: string; headerRight?: () => React.ReactElement } = {
      headerTitle: showHeaderTitle && user ? user.display_name : '',
    };
    // Only override headerRight for other users' profiles (block button).
    // For own profile, leave it untouched so the tab layout's menu button persists.
    if (!isOwnProfile && user) {
      options.headerRight = () => (
        <TouchableOpacity
          onPress={handleUserMenu}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <IconSymbol name="ellipsis" size={22} color={theme.text} />
        </TouchableOpacity>
      );
    }
    navigation.setOptions(options);
  }, [showHeaderTitle, user, navigation, isOwnProfile, theme.text]);

  // Reset scroll state when switching tabs
  useEffect(() => {
    scrollY.value = 0;
    setStickyTabsInteractive(false);
    setShowHeaderTitle(false);
  }, [activeTab]);

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
        setLoadError(getErrorMessage(error));
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
  const { quotes, refreshing, isLoadingMore, loadMore, likeQuoteById, witnessQuoteById, guessQuoteById, unhideQuoteById, respondToQuoteById } = activeFeed;

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

  const handleBlockUser = () => {
    if (!user) return;

    const performBlock = async () => {
      try {
        await blockUserById(user.id);
        removeQuotesInvolvingUser(user.id);
        Toast.show({ type: 'info', text1: `@${user.username} blocked` });
        router.back();
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Failed to block user' });
      }
    };

    Alert.alert(
      `Block @${user.username}?`,
      "You won't see any quotes from them anymore. You can unblock them later in Settings.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block Account', style: 'destructive', onPress: performBlock },
      ]
    );
  };

  const submitUserReport = async (reason: ReportReasonEnum) => {
    if (!user) return;
    try {
      await reportUser(user.id, { reason });
      const reportedUserId = user.id;
      const reportedUsername = user.username;
      Toast.show({
        type: 'success',
        text1: `@${reportedUsername} reported`,
        text2: 'Tap to undo',
        onPress: async () => {
          Toast.hide();
          try {
            await unreportUser(reportedUserId);
            Toast.show({ type: 'info', text1: 'Report withdrawn' });
          } catch (undoError) {
            Toast.show({ type: 'error', text1: 'Failed to undo report', text2: getErrorMessage(undoError) });
          }
        },
      });
    } catch (error) {
      const detail = getErrorMessage(error);
      console.error('Report user failed:', detail);
      Toast.show({ type: 'error', text1: 'Failed to report user', text2: detail });
    }
  };

  const handleReportUser = () => {
    if (!user) return;

    Alert.alert(
      `Report @${user.username}`,
      "Why are you reporting this user?",
      [
        { text: 'Inappropriate', onPress: () => submitUserReport('inappropriate') },
        { text: 'Spam', onPress: () => submitUserReport('spam') },
        { text: 'Harassment', onPress: () => submitUserReport('harassment') },
        { text: 'Other', onPress: () => submitUserReport('other') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleUserMenu = () => {
    if (!user) return;

    Alert.alert(
      '',
      undefined,
      [
        { text: 'Report User', style: 'destructive', onPress: handleReportUser },
        { text: 'Block User', style: 'destructive', onPress: handleBlockUser },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Update sticky tabs and header title state
  const updateScrollState = useCallback((isInteractive: boolean, shouldShowTitle: boolean) => {
    setStickyTabsInteractive(isInteractive);
    setShowHeaderTitle(shouldShowTitle);
  }, []);

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      // Update interactive state when crossing threshold
      const threshold = headerHeight;
      const shouldBeInteractive = event.contentOffset.y >= threshold && headerHeight > 0;
      // Show header title slightly before tabs stick (when profile info scrolls away)
      const shouldShowTitle = event.contentOffset.y >= threshold * 0.6 && headerHeight > 0;
      runOnJS(updateScrollState)(shouldBeInteractive, shouldShowTitle);
    },
  });

  // Measure header height (content above tabs)
  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  // Animated style for sticky tabs
  const stickyTabsStyle = useAnimatedStyle(() => {
    // Don't show until header height is measured
    if (headerHeight === 0) {
      return { opacity: 0 };
    }
    const threshold = headerHeight;
    const opacity = interpolate(
      scrollY.value,
      [threshold - 10, threshold],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const renderFooter = (isLoading: boolean) => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  // Handle both User (string) and PublicUser (number) types
  const friendsCount = user?.friends_count ?? 0;
  const quotesPostedCount = user?.quotes_posted ?? 0;
  const quotesReceivedCount = user?.quotes_received ?? 0;
  const currentStreak = user?.current_streak ?? 0;
  const longestStreak = user?.longest_streak ?? 0;

  // Get user's profile color
  const userProfileColor = user?.profile_color
    ? ProfileColorHexMap[user.profile_color as ProfileColorEnum]
    : theme.pastels.purple;

  // Render tabs (reused for inline and sticky)
  const renderTabs = useCallback(() => (
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
  ), [activeTab, userProfileColor, postedPulseAnim, receivedPulseAnim, handleTabChange, styles]);

  // List header component with profile info and tabs
  const ListHeaderComponent = useMemo(() => {
    if (!user) return null;

    return (
      <View>
        {/* Scrollable header content - measure this to know when tabs reach top */}
        <View onLayout={handleHeaderLayout}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleAvatarPress}>
              <ReAnimated.View style={[styles.headerAvatar, avatarAnimatedStyle]}>
                <InitialsAvatar user={user} size={80} />
              </ReAnimated.View>
            </Pressable>
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
              />
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: hexToRgba(userProfileColor, 0.08), borderColor: hexToRgba(userProfileColor, 0.15) }]}
              activeOpacity={0.7}
              onPress={() => handleTabChange('posted')}
            >
              <ThemedText type="title">{quotesPostedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Posted</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: hexToRgba(userProfileColor, 0.08), borderColor: hexToRgba(userProfileColor, 0.15) }]}
              activeOpacity={0.7}
              onPress={() => handleTabChange('received')}
            >
              <ThemedText type="title">{quotesReceivedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Received</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: hexToRgba(userProfileColor, 0.08), borderColor: hexToRgba(userProfileColor, 0.15) }]}
              activeOpacity={0.7}
              onPress={handleOpenFriends}
            >
              <ThemedText type="title">{friendsCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Friends</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Streak Row */}
          {(currentStreak > 0 || longestStreak > 0) && (
            <View style={styles.streakRow}>
              <View style={[styles.streakCard, { backgroundColor: hexToRgba(userProfileColor, 0.08), borderColor: hexToRgba(userProfileColor, 0.15) }]}>
                <ThemedText style={styles.streakEmoji}>🔥</ThemedText>
                <View>
                  <ThemedText style={styles.streakValue}>{currentStreak}</ThemedText>
                  <ThemedText style={styles.streakLabel}>Guess streak</ThemedText>
                </View>
              </View>
              <View style={[styles.streakCard, { backgroundColor: hexToRgba(userProfileColor, 0.08), borderColor: hexToRgba(userProfileColor, 0.15) }]}>
                <ThemedText style={styles.streakEmoji}>👑</ThemedText>
                <View>
                  <ThemedText style={styles.streakValue}>{longestStreak}</ThemedText>
                  <ThemedText style={styles.streakLabel}>Best streak</ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Tabs */}
        {renderTabs()}
      </View>
    );
  }, [user, isOwnProfile, friendship, quotesPostedCount, quotesReceivedCount, friendsCount,
      currentStreak, longestStreak,
      styles, theme, avatarAnimatedStyle, handleHeaderLayout, handleAvatarPress,
      handleFriendshipChange, handleTabChange, handleOpenFriends, renderTabs]);

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.centerText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    if (loadError) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ThemedText style={styles.centerText}>{"Couldn't load profile"}</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoadError(null);
              setLoading(true);
              getUser(userId!).then((userData) => {
                setUser(userData);
                setFriendship(userData.friendship || null);
              }).catch((e) => setLoadError(getErrorMessage(e))).finally(() => setLoading(false));
            }}
          >
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.centerText}>User not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {/* Quote Feed with header */}
        <ReAnimated.FlatList
          key={activeTab}
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
              onRespond={respondToQuoteById}
            />
          )}
          refreshing={refreshing}
          onRefresh={activeTab === 'posted' ? handleRefreshPosted : handleRefreshReceived}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={renderFooter(isLoadingMore)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                {activeTab === 'posted' ? 'No quotes posted yet' : 'No quotes received yet'}
              </ThemedText>
            </View>
          }
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />

        {/* Sticky tabs - appear when tabs scroll to top */}
        <ReAnimated.View
          style={[
            styles.stickyTabsContainer,
            stickyTabsStyle
          ]}
          pointerEvents={stickyTabsInteractive ? 'auto' : 'none'}
        >
          {renderTabs()}
        </ReAnimated.View>

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
    retryButton: {
      marginTop: 16,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderColor: theme.border,
    },
    retryText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
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
    streakRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 16,
    },
    streakCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      gap: 10,
    },
    streakEmoji: {
      fontSize: 20,
    },
    streakValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    streakLabel: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 1,
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
    stickyTabsContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 99,
      backgroundColor: theme.background,
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
