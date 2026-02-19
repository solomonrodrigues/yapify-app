// components/UserListModal.tsx
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getErrorMessage } from '@/lib/utils/error';
import type { PublicUser } from '@/types/api';
import { LegendList } from '@legendapp/list';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  const [error, setError] = useState<string | null>(null);

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
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
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

  const renderUserItem = ({ item, index }: { item: PublicUser; index: number }) => (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 300)).duration(300).springify()}>
      <TouchableOpacity
        style={styles.userItem}
        activeOpacity={0.7}
        onPress={() => handleUserPress(item)}
      >
        <InitialsAvatar user={item} size={44} />
        <View style={styles.userInfo}>
          <ThemedText style={styles.userName}>{item.display_name}</ThemedText>
          <ThemedText style={styles.userUsername}>@{item.username}</ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={14} color={theme.secondaryText} />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFooter = () => {
    // Only show footer when loading more (pagination), not on initial load
    if (!loading || users.length === 0) return null;
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerCenter}>
              <View style={styles.grabber} />
              <ThemedText style={styles.headerTitle}>{title}</ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <View style={styles.closeButtonCircle}>
                <IconSymbol name="xmark" size={12} color={theme.secondaryText} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Count badge */}
          {!loading && users.length > 0 && (
            <View style={styles.countRow}>
              <Text style={[styles.countText, { fontVariant: ['tabular-nums'] }]}>
                {users.length}{hasMore ? '+' : ''} {title.toLowerCase()}
              </Text>
            </View>
          )}

          {searchable && (
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search users"
              />
            </View>
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
              loading ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" />
                </View>
              ) : error ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>{"Couldn't load users"}</ThemedText>
                  <TouchableOpacity
                    onPress={() => loadUsers({ search: searchQuery || undefined })}
                    style={styles.retryButton}
                  >
                    <ThemedText style={styles.retryText}>Retry</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <IconSymbol name="person.2" size={40} color={theme.border} />
                  <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
                </View>
              )
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
    countRow: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    countText: {
      fontSize: 13,
      color: theme.secondaryText,
    },
    searchContainer: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
    },
    usersList: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      gap: 6,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.cardBackground,
      borderCurve: 'continuous',
    },
    userInfo: {
      marginLeft: 12,
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      lineHeight: 21,
    },
    userUsername: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 2,
      lineHeight: 17,
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
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
      color: theme.secondaryText,
      textAlign: 'center',
      lineHeight: 22,
    },
    retryButton: {
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderColor: theme.border,
    },
    retryText: {
      fontSize: 15,
      fontWeight: '600',
    },
  });
