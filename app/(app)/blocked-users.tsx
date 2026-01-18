// app/(app)/blocked-users.tsx
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useBlockedUsers } from '@/context/BlockedUsersContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { PublicUser } from '@/types/api';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BlockedUsersScreen() {
  const {
    blockedUsers,
    loading,
    hasLoadedOnce,
    loadBlockedUsers,
    unblockUserById,
  } = useBlockedUsers();

  const styles = useThemedStyles(getStyles);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (!hasLoadedOnce) {
      loadBlockedUsers();
    }
  }, [hasLoadedOnce, loadBlockedUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  };

  const handleUnblock = (user: PublicUser) => {
    Alert.alert(
      'Unblock Account',
      `Are you sure you want to unblock @${user.username}? You will start seeing their quotes from them again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUserById(user.id);
              Toast.show({ type: 'success', text1: `@${user.username} unblocked` });
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Failed to unblock user' });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PublicUser }) => (
    <View style={styles.userRow}>
      <InitialsAvatar user={item} size={44} />
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>{item.display_name}</ThemedText>
        <ThemedText style={styles.username}>@{item.username}</ThemedText>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.unblockButton,
          pressed && styles.unblockButtonPressed,
        ]}
        onPress={() => handleUnblock(item)}
      >
        <ThemedText style={styles.unblockText}>Unblock</ThemedText>
      </Pressable>
    </View>
  );

  if (loading && !hasLoadedOnce) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {/* Explanation Card */}
        <View style={styles.infoCard}>
          <ThemedText style={styles.infoTitle}>What does blocking do?</ThemedText>
          <ThemedText style={styles.infoText}>
            When you block someone, you will not see quotes they posted or quotes from them in your feed.
            They will not be notified that you blocked them.
          </ThemedText>
        </View>

        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            blockedUsers.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                You have not blocked anyone
              </ThemedText>
            </View>
          }
        />
      </View>
    </ThemedView>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.secondaryText,
    },
    infoCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.divider,
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.secondaryText,
      lineHeight: 20,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: theme.secondaryText,
      textAlign: 'center',
    },
    listContent: {
      paddingBottom: 20,
      flexGrow: 1,
    },
    emptyListContent: {
      justifyContent: 'center',
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    displayName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    username: {
      fontSize: 14,
      color: theme.secondaryText,
      marginTop: 2,
    },
    unblockButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.cardBackground,
    },
    unblockButtonPressed: {
      opacity: 0.7,
    },
    unblockText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    separator: {
      height: 1,
      backgroundColor: theme.divider,
    },
  });
