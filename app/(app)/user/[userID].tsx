import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getUser, sendFriendRequest, cancelFriendRequest, unfriend } from '@/api/friends';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Colors } from '@/constants/Colors';
import type { Friendship, PublicUser } from '@/types/api';

type LoadingState = { type: 'loading' };
type ErrorState = { type: 'error'; message: string };
type SuccessState = { type: 'success'; user: PublicUser };
type UserState = LoadingState | ErrorState | SuccessState;

export default function UserScreen() {
  const params = useLocalSearchParams();
  const { userID } = params;

  const [userState, setUserState] = useState<UserState>({ type: 'loading' });
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useThemedStyles(getStyles);

  const loadUser = useCallback(async () => {
    if (!userID) {
      setUserState({ type: 'error', message: 'No user ID provided' });
      return;
    }

    try {
      const data = await getUser(Number(userID));
      setUserState({ type: 'success', user: data });
      setFriendship(data.friendship as Friendship ?? null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUserState({ type: 'error', message: 'Failed to load user' });
    }
  }, [userID]);

  useEffect(() => {
    loadUser();
  }, [loadUser, userID]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
  };

  const handleFriendAction = async (user: PublicUser, action: 'add' | 'cancel' | 'unfriend') => {
    setActionLoading(true);
    try {
      let res;
      switch (action) {
        case 'add':
          res = await sendFriendRequest(user.id);
          setFriendship(res.friendship);
          break;
        case 'cancel':
          await cancelFriendRequest(user.id);
          setFriendship(null);
          break;
        case 'unfriend':
          await unfriend(user.id);
          setFriendship(null);
          break;
      }
    } catch (err) {
      console.error(`Failed to ${action} friend:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  // Loading gate
  if (userState.type === 'loading') {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.centerSubtext}>Loading user...</ThemedText>
      </ThemedView>
    );
  }

  // Error gate
  if (userState.type === 'error') {
    return (
      <ThemedView style={styles.center}>
        <IconSymbol name="person.crop.circle.badge.xmark" size={64} color="gray" />
        <ThemedText type="subtitle" style={styles.centerText}>
          {userState.message}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadUser}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Success - TypeScript now knows user exists
  const { user } = userState;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Profile Info */}
          <View style={styles.profileContainer}>
            <InitialsAvatar user={user} size={100} style={{ marginBottom: 16 }} />
            <ThemedText type="title">{user.display_name}</ThemedText>
            <ThemedText style={styles.username}>@{user.username}</ThemedText>
            
            {/* Friend Button */}
            <FriendButton
              friendship={friendship}
              onAction={(action) => handleFriendAction(user, action)}
              loading={actionLoading}
              styles={styles}
            />
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <ThemedText type="title">{user.total_quotes_posted}</ThemedText>
              <ThemedText style={styles.statLabel}>Posted</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <ThemedText type="title">{user.total_quotes_received}</ThemedText>
              <ThemedText style={styles.statLabel}>Received</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Recent Quotes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="quote.bubble.fill" size={20} color="gray" style={styles.sectionIcon} />
              <ThemedText type="subtitle">Recent Quotes</ThemedText>
            </View>
            {user.recent_quotes_posted && user.recent_quotes_posted.length > 0 ? (
              <View style={styles.quotesContainer}>
                {/* Placeholder for actual quote cards */}
                <View style={styles.sectionCard}>
                  <ThemedText style={styles.emptyText}>Quote display coming soon</ThemedText>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="quote.bubble" size={32} color="gray" />
                <ThemedText style={styles.emptyText}>No recent quotes</ThemedText>
              </View>
            )}
          </View>

          {/* Member Since */}
          {user.date_joined && (
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <IconSymbol name="calendar" size={16} color="gray" />
                <ThemedText style={styles.infoText}>
                  Member since {new Date(user.date_joined).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </ThemedText>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

type FriendAction = 'add' | 'cancel' | 'unfriend';

function FriendButton({
  friendship,
  onAction,
  loading,
  styles,
}: {
  friendship: Friendship | null;
  onAction: (action: FriendAction) => void;
  loading: boolean;
  styles: any;
}) {
  const getButtonConfig = (): {
    text: string;
    style: any;
    textStyle: any;
    action?: FriendAction;
    icon?: string;
  } => {
    if (!friendship) {
      return {
        text: 'Add Friend',
        style: styles.friendButtonPrimary,
        textStyle: styles.friendButtonTextPrimary,
        action: 'add',
        icon: 'person.badge.plus',
      };
    }

    switch (friendship.status) {
      case 'pending':
        // Check if current user sent the request or received it
        // For now assuming we sent it, so show cancel option
        return {
          text: 'Requested',
          style: styles.friendButtonSecondary,
          textStyle: styles.friendButtonTextSecondary,
          action: 'cancel',
          icon: 'clock',
        };
      case 'accepted':
        return {
          text: 'Friends',
          style: styles.friendButtonSuccess,
          textStyle: styles.friendButtonTextSuccess,
          action: 'unfriend',
          icon: 'checkmark.circle.fill',
        };
      case 'rejected':
        return {
          text: 'Request Declined',
          style: styles.friendButtonDisabled,
          textStyle: styles.friendButtonTextDisabled,
        };
      case 'blocked':
        return {
          text: 'Blocked',
          style: styles.friendButtonDisabled,
          textStyle: styles.friendButtonTextDisabled,
        };
      default:
        return {
          text: 'Add Friend',
          style: styles.friendButtonPrimary,
          textStyle: styles.friendButtonTextPrimary,
          action: 'add',
          icon: 'person.badge.plus',
        };
    }
  };

  const config = getButtonConfig();

  return (
    <TouchableOpacity
      style={[styles.friendButton, config.style]}
      onPress={() => config.action && onAction(config.action)}
      disabled={!config.action || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={config.action === 'add' ? '#fff' : 'gray'} />
      ) : (
        <View style={styles.friendButtonContent}>
          {config.icon && (
            <IconSymbol 
              name={config.icon as any} 
              size={16} 
              color={config.textStyle.color} 
              style={styles.friendButtonIcon}
            />
          )}
          <ThemedText style={config.textStyle}>{config.text}</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      padding: 16,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      padding: 24,
    },
    centerText: {
      marginTop: 16,
      color: theme.secondaryText,
      textAlign: 'center',
    },
    centerSubtext: {
      marginTop: 8,
      color: theme.secondaryText,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: '#0095f6',
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    profileContainer: {
      alignItems: 'center',
      marginBottom: 24,
      paddingTop: 8,
    },
    username: {
      marginTop: 4,
      marginBottom: 16,
      color: theme.secondaryText,
      fontSize: 15,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 24,
      gap: 12,
    },
    statCard: {
      flex: 1,
      padding: 20,
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
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    sectionIcon: {
      marginRight: 4,
    },
    sectionCard: {
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.cardBackground,
    },
    quotesContainer: {
      gap: 12,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
      gap: 8,
    },
    emptyText: {
      color: theme.secondaryText,
      textAlign: 'center',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    infoText: {
      color: theme.secondaryText,
      fontSize: 14,
    },
    friendButton: {
      paddingHorizontal: 32,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 160,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 38,
    },
    friendButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    friendButtonIcon: {
      marginRight: 2,
    },
    friendButtonPrimary: {
      backgroundColor: '#0095f6',
    },
    friendButtonSecondary: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.divider,
    },
    friendButtonSuccess: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: '#4ade80',
    },
    friendButtonDisabled: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.divider,
      opacity: 0.5,
    },
    friendButtonTextPrimary: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: 15,
    },
    friendButtonTextSecondary: {
      color: theme.text,
      fontWeight: '600',
      fontSize: 15,
    },
    friendButtonTextSuccess: {
      color: '#4ade80',
      fontWeight: '600',
      fontSize: 15,
    },
    friendButtonTextDisabled: {
      color: theme.secondaryText,
      fontWeight: '600',
      fontSize: 15,
    },
  }
);
