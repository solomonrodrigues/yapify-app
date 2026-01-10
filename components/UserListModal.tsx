// components/UserListModal.tsx
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { PublicUser } from '@/types/api';
import { LegendList } from '@legendapp/list';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type UserListFetcher = (params: {
  url?: string | null;
  search?: string;
}) => Promise<{
  results: PublicUser[];
  next: string | null;
}>;

interface UserListModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  fetcher: UserListFetcher;
  onUserPress?: (user: PublicUser) => void;
  searchable?: boolean;
  emptyMessage?: string;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  visible,
  onClose,
  title,
  fetcher,
  onUserPress,
  searchable = true,
  emptyMessage = 'No users found',
}) => {
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadUsers = useCallback(
    async ({
      url,
      search,
      refresh = false,
    }: {
      url?: string | null;
      search?: string;
      refresh?: boolean;
    } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        // If this is a fresh load (no pagination url), reset pagination cursors
        if (!url) {
          setNextUrl(null);
        }

        const data = await fetcher({ url, search });

        if (refresh || !url) {
          setUsers(data.results);
        } else {
          setUsers((prev) => [...prev, ...data.results]);
        }

        setNextUrl(data.next ?? null);
        setHasMore(Boolean(data.next));
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetcher]
  );

  // Initial load when modal becomes visible
  useEffect(() => {
    if (visible && users.length === 0) {
      loadUsers({ search: searchQuery || undefined });
    }
  }, [visible]);

  const handleLoadMore = () => {
    if (hasMore && !loading && nextUrl) {
      loadUsers({ url: nextUrl });
    }
  };

  const handleRefresh = () => {
    loadUsers({ refresh: true, search: searchQuery || undefined });
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    loadUsers({ search: text, refresh: true });
  };

  const handleUserPress = (user: PublicUser) => {
    if (onUserPress) {
      onUserPress(user);
    }
  };

  const renderUserItem = ({ item }: { item: PublicUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      activeOpacity={0.7}
      onPress={() => handleUserPress(item)}
    >
      <InitialsAvatar user={item} size={48} />
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>{item.display_name}</ThemedText>
        <ThemedText style={styles.userUsername}>@{item.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading more...</Text>
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
          <View style={styles.modalHeader}>
            <ThemedText type="title">{title}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </View>
          {searchable && (
            <TextInput
              style={[
                styles.searchInput,
                {
                  borderColor: theme.divider,
                  backgroundColor: theme.cardBackground,
                  color: theme.text,
                },
              ]}
              placeholder="Search users"
              placeholderTextColor={theme.secondaryText}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          )}
          <LegendList
            data={users}
            keyExtractor={(item: PublicUser) => item.id.toString()}
            renderItem={renderUserItem}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersList}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
              </View>
            }
          />
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
      paddingVertical: 18,
      paddingLeft: 20,
      paddingRight: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    closeButton: {
      padding: 8,
      marginLeft: 12,
    },
    closeButtonText: {
      fontSize: 28,
      color: theme.secondaryText,
      fontWeight: '300',
      lineHeight: 28,
    },
    searchInput: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      fontSize: 15,
    },
    usersList: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: theme.cardBackground,
    },
    userInfo: {
      marginLeft: 14,
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      lineHeight: 22,
    },
    userUsername: {
      fontSize: 14,
      color: theme.secondaryText,
      marginTop: 3,
      lineHeight: 18,
    },
    loadingFooter: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: theme.secondaryText,
    },
    emptyContainer: {
      paddingVertical: 64,
      paddingHorizontal: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.secondaryText,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
