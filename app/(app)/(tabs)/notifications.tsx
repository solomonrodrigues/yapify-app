import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { getNotifications, markNotificationRead } from '@/lib/api/notifications';
import { Notification } from '@/types/api';
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

// Individual Notification Component
interface NotificationItemProps {
  notification: Notification;
  theme: any;
  onPress: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, theme, onPress }) => {
  const { id, message, is_read } = notification;

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          opacity: is_read ? 0.6 : 1,
        },
      ]}
      onPress={() => onPress(id)}
    >
      <Text style={[styles.notificationText, { color: theme.text }]}>
        {message}
      </Text>
      {!is_read && (
        <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]} />
      )}
    </TouchableOpacity>
  );
};

// Main Notifications View
const NotificationsView: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.results);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
  }

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
    <SafeAreaView style={styles.container}>
      <LegendList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            theme={theme}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchNotifications();
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
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
    padding: 16,
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
