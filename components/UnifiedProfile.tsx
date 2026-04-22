import FeedQuote from '@/components/FeedQuote';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, ProfileColorHexMap } from '@/constants/Colors';
import { useBlockedUsers } from '@/context/BlockedUsersContext';
import { useQuotes } from '@/context/QuotesContext';
import { useQuotesFeed } from '@/hooks/useQuotesFeed';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getUser, reportUser, unreportUser } from '@/lib/api/users';
import { getErrorMessage } from '@/lib/utils/error';
import { hexToRgba } from '@/lib/utils/style';
import type { User as CurrentUser, PublicUser, Quote, ProfileColorEnum, ReportReasonEnum } from '@/types/api';
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
  userId?: number;
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

  const [user, setUser] = useState<ProfileUser | null>(isOwnProfile ? currentUser : null);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posted');

  const [headerHeight, setHeaderHeight] = useState(0);
  const [stickyTabsInteractive, setStickyTabsInteractive] = useState(false);
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const scrollY = useSharedValue(0);

  const postedPulseAnim = useRef(new Animated.Value(1)).current;
  const receivedPulseAnim = useRef(new Animated.Value(1)).current;
  const avatarRotation = useSharedValue(0);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${avatarRotation.value}deg` }],
  }));

  const handleAvatarPress = () => {
    avatarRotation.value = withSequence(
      withTiming(-30, { duration: 150, easing: Easing.out(Easing.quad) }),
      withSpring(360, { damping: 12, stiffness: 100, mass: 0.8 }),
      withTiming(0, { duration: 0 })
    );
  };

  useEffect(() => {
    if (isOwnProfile) {
      setUser(currentUser);
    }
  }, [currentUser, isOwnProfile]);

  useEffect(() => {
    const options: { headerTitle: string; headerRight?: () => React.ReactElement } = {
      headerTitle: showHeaderTitle && user ? user.display_name : '',
    };
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

  useEffect(() => {
    scrollY.value = 0;
    setStickyTabsInteractive(false);
    setShowHeaderTitle(false);
  }, [activeTab]);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userData = await getUser(userId);
        setUser(userData);
      } catch (error) {
        setLoadError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    if (!isOwnProfile && userId) {
      loadUserProfile();
    }
  }, [userId, isOwnProfile]);

  const postedFeed = useQuotesFeed({
    scope: { type: 'user-posted', id: userId ?? currentUser.id },
  });

  const receivedFeed = useQuotesFeed({
    scope: { type: 'user-received', id: userId ?? currentUser.id },
  });

  const activeFeed = activeTab === 'posted' ? postedFeed : receivedFeed;
  const { quotes, refreshing, isLoadingMore, initialLoading, hasLoadedOnce, error, loadMore, loadQuotes, likeQuoteById, witnessQuoteById, guessQuoteById, unhideQuoteById, respondToQuoteById } = activeFeed;

  const prevErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (hasLoadedOnce && error && error !== prevErrorRef.current) {
      Toast.show({ type: 'error', text1: 'Failed to refresh quotes' });
    }
    prevErrorRef.current = error ?? null;
  }, [error, hasLoadedOnce]);

  useEffect(() => {
    if (user) {
      postedFeed.loadQuotes();
      receivedFeed.loadQuotes();
    }
  }, [user]);

  const handleRefreshPosted = () => postedFeed.refreshQuotes();
  const handleRefreshReceived = () => receivedFeed.refreshQuotes();

  const triggerPulse = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    triggerPulse(tab === 'posted' ? postedPulseAnim : receivedPulseAnim);
  };

  const handleBlockUser = () => {
    if (!user) return;

    const performBlock = async () => {
      try {
        await blockUserById(user.id);
        removeQuotesInvolvingUser(user.id);
        Toast.show({ type: 'info', text1: `@${user.username} blocked` });
        router.back();
      } catch {
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
      Toast.show({ type: 'error', text1: 'Failed to report user', text2: getErrorMessage(error) });
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
    Alert.alert('', undefined, [
      { text: 'Report User', style: 'destructive', onPress: handleReportUser },
      { text: 'Block User', style: 'destructive', onPress: handleBlockUser },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const updateScrollState = useCallback((isInteractive: boolean, shouldShowTitle: boolean) => {
    setStickyTabsInteractive(isInteractive);
    setShowHeaderTitle(shouldShowTitle);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const threshold = headerHeight;
      const shouldBeInteractive = event.contentOffset.y >= threshold && headerHeight > 0;
      const shouldShowTitle = event.contentOffset.y >= threshold * 0.6 && headerHeight > 0;
      runOnJS(updateScrollState)(shouldBeInteractive, shouldShowTitle);
    },
  });

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  const stickyTabsStyle = useAnimatedStyle(() => {
    if (headerHeight === 0) return { opacity: 0 };
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

  const quotesPostedCount = user?.quotes_posted ?? 0;
  const quotesReceivedCount = user?.quotes_received ?? 0;
  const currentStreak = user?.current_streak ?? 0;
  const longestStreak = user?.longest_streak ?? 0;

  const userProfileColor = user?.profile_color
    ? ProfileColorHexMap[user.profile_color as ProfileColorEnum]
    : theme.pastels.purple;

  const renderTabs = useCallback(() => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'posted' && { borderBottomColor: userProfileColor }]}
        onPress={() => handleTabChange('posted')}
      >
        <Animated.View style={{ transform: [{ scale: postedPulseAnim }] }}>
          <ThemedText style={[styles.tabText, activeTab === 'posted' && styles.tabTextActive]}>
            Posted
          </ThemedText>
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'received' && { borderBottomColor: userProfileColor }]}
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

  const ListHeaderComponent = useMemo(() => {
    if (!user) return null;

    return (
      <View>
        <View onLayout={handleHeaderLayout}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleAvatarPress}>
              <ReAnimated.View style={avatarAnimatedStyle}>
                <InitialsAvatar user={user} size={96} />
              </ReAnimated.View>
            </Pressable>

            <View style={styles.headerInfo}>
              <ThemedText style={styles.displayName} numberOfLines={2}>{user.display_name}</ThemedText>
              <View style={styles.usernameRow}>
                <ThemedText style={styles.username}>@{user.username}</ThemedText>
                {(currentStreak > 0 || longestStreak > 0) && (
                  <View style={styles.streakRow}>
                    {currentStreak > 0 && (
                      <View style={[styles.streakPill, { backgroundColor: hexToRgba(userProfileColor, 0.12) }]}>
                        <IconSymbol name="flame.fill" size={11} color="#FF5722" />
                        <ThemedText style={styles.streakPillText}>{currentStreak}</ThemedText>
                      </View>
                    )}
                    {longestStreak > 0 && (
                      <View style={[styles.streakPill, { backgroundColor: hexToRgba(userProfileColor, 0.12) }]}>
                        <IconSymbol name="trophy.fill" size={11} color="#F9A825" />
                        <ThemedText style={styles.streakPillText}>{longestStreak}</ThemedText>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          {'bio' in user && user.bio ? (
            <ThemedText style={styles.bio}>{user.bio}</ThemedText>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{quotesPostedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Posted</ThemedText>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{quotesReceivedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>{"Recv'd"}</ThemedText>
            </View>
          </View>
        </View>

        {renderTabs()}
      </View>
    );
  }, [user, isOwnProfile, quotesPostedCount, quotesReceivedCount,
      currentStreak, longestStreak, userProfileColor,
      styles, avatarAnimatedStyle, handleHeaderLayout, handleAvatarPress, renderTabs]);

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
            initialLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" />
              </View>
            ) : !hasLoadedOnce && error ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>{"Couldn't load quotes"}</ThemedText>
                <TouchableOpacity style={styles.retryButton} onPress={() => loadQuotes()}>
                  <ThemedText style={styles.retryText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  {activeTab === 'posted' ? 'No quotes posted yet.' : 'No quotes received yet.'}
                </ThemedText>
              </View>
            )
          }
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        />

        <ReAnimated.View
          style={[styles.stickyTabsContainer, stickyTabsStyle]}
          pointerEvents={stickyTabsInteractive ? 'auto' : 'none'}
        >
          {renderTabs()}
        </ReAnimated.View>
      </SafeAreaView>
    </ThemedView>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    safeArea: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    centerText: { marginTop: 16, fontSize: 16, color: theme.secondaryText },
    retryButton: {
      marginTop: 16, borderWidth: 1, borderRadius: 8,
      paddingVertical: 10, paddingHorizontal: 20, borderColor: theme.border,
    },
    retryText: { fontSize: 15, fontWeight: '600', color: theme.text },
    headerRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, gap: 16,
    },
    headerInfo: { flex: 1, justifyContent: 'center' },
    displayName: { fontSize: 20, fontWeight: '700', color: theme.text, lineHeight: 26 },
    usernameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 3 },
    username: { fontSize: 14, color: theme.secondaryText },
    streakRow: { flexDirection: 'row', gap: 5 },
    streakPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
    streakPillText: { fontSize: 11, fontWeight: '700', color: theme.text },
    statsRow: {
      flexDirection: 'row', alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider,
      paddingVertical: 14,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statSeparator: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: theme.divider },
    statNumber: { fontSize: 20, fontWeight: '700', color: theme.text, lineHeight: 24 },
    statLabel: { marginTop: 2, fontSize: 12, color: theme.secondaryText, lineHeight: 16 },
    bio: { color: theme.secondaryText, fontSize: 14, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 16 },
    tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.divider },
    tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 15, fontWeight: '600', color: theme.secondaryText },
    tabTextActive: { color: theme.text },
    stickyTabsContainer: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99,
      backgroundColor: theme.background,
    },
    listContent: { paddingBottom: 48 },
    loadingFooter: { padding: 20, alignItems: 'center' },
    loadingText: { marginTop: 8, fontSize: 14, color: theme.secondaryText },
    emptyContainer: { padding: 48, alignItems: 'center' },
    emptyText: { fontSize: 16, color: theme.secondaryText, textAlign: 'center' },
  });

export default UnifiedProfile;
