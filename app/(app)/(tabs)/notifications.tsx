import { NotificationItem } from '@/components/NotificationItem';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { getNotifications, markNotificationRead } from '@/lib/api/notifications';
import { Friendship, Notification } from '@/types/api';
import { LegendList } from '@legendapp/list';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Main Notifications View
const NotificationsView: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = async (url?: string, mode: 'reset' | 'append' = 'reset') => {
    try {
      const res = await getNotifications(url); // accept optional full URL or page param in your client
      setNextUrl(res.next ?? null);
      setPrevUrl(res.previous ?? null);
      setNotifications((prev) => (mode === 'append' ? [...prev, ...res.results] : res.results));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && nextUrl) {
      setLoadingMore(true);
      fetchNotifications(nextUrl, 'append');
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleNotificationPress = async (item: Notification) => {
    if (!item.is_read) {
      handleMarkRead(item.id);
    }
    if (item.notification_type === 'new_quote' || item.notification_type === 'quote_liked' || item.notification_type === 'quote_witnessed') {
      router.push({
        pathname: "/(app)/[quoteID]",
        params: { quoteID: item.quote! },
      });
    }
  };

  const handleInlineFriendshipChange = (notificationId: number, friendship: Friendship | null) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, friendship, is_read: true } // mark read if you like
          : n
      )
    );
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>
          Loading notifications...
        </ThemedText>
      </ThemedView>
    );
  }

  if (notifications.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>
          No notifications
        </ThemedText>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: theme.accent }]}
          onPress={() => {
            setRefreshing(true);
            fetchNotifications();
          }}
        >
          <Text style={[styles.retryText, { color: theme.accent }]}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <LegendList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              theme={theme}
              onPress={() => handleNotificationPress(item)}
              onFriendshipChange={handleInlineFriendshipChange}
            />
          )}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchNotifications();
          }}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 16,
    flex: 1,
    flexWrap: 'wrap',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationsView;
