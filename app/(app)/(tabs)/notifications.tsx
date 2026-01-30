import { NotificationItem } from '@/components/NotificationItem';
import { SkeletonNotificationItem } from '@/components/Skeleton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useNotifications } from '@/context/NotificationsContext';
import { Notification } from '@/types/api';
import { LegendList } from '@legendapp/list';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
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

  const {
    notifications,
    loading,
    refreshing,
    loadingMore,
    hasLoadedOnce,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAsUnread,
    deleteNotification,
    updateFriendship,
    refresh,
  } = useNotifications();

  const handleNotificationPress = async (item: Notification) => {
    if (!item.is_read) {
      try {
        await markAsRead(item.id);
      } catch {
        Alert.alert('Error', 'Failed to mark notification as read');
      }
    }
    if (item.notification_type === 'new_quote' || item.notification_type === 'quote_liked' || item.notification_type === 'quote_witnessed') {
      router.push({
        pathname: "/(app)/[quoteID]",
        params: { quoteID: item.quote! },
      });
    }
  };

  useEffect(() => {
    if (!hasLoadedOnce) {
      fetchNotifications();
    }
  }, [hasLoadedOnce, fetchNotifications]);

  if (loading) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <View style={styles.listContainer}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonNotificationItem key={i} />
          ))}
        </View>
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
          onPress={refresh}
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
              onFriendshipChange={updateFriendship}
              onMarkUnread={(id) => markAsUnread(id).catch(() => Alert.alert('Error', 'Failed to mark as unread'))}
              onMarkRead={(id) => markAsRead(id).catch(() => Alert.alert('Error', 'Failed to mark as read'))}
              onDelete={(id) => deleteNotification(id).catch(() => Alert.alert('Error', 'Failed to delete notification'))}
            />
          )}
          refreshing={refreshing}
          onRefresh={refresh}
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
