import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getNotifications, markNotificationRead } from '@/api/notifications';
import { Notification } from '@/types/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';

// Theme types
interface Theme {
  background: string;
  cardBackground: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  border: string;
  readBadge: string;
}

// Theme colors
const themes: { light: Theme; dark: Theme } = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#F8F9FA',
    primaryText: '#1A1A1A',
    secondaryText: '#6B7280',
    accent: '#3B82F6',
    border: '#E5E7EB',
    readBadge: '#D1D5DB',
  },
  dark: {
    background: '#000000',
    cardBackground: '#1F2937',
    primaryText: '#FFFFFF',
    secondaryText: '#9CA3AF',
    accent: '#60A5FA',
    border: '#374151',
    readBadge: '#4B5563',
  },
};

// Individual Notification Component
interface NotificationItemProps {
  notification: Notification;
  theme: Theme;
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
      <Text style={[styles.notificationText, { color: theme.primaryText }]}>
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
  const theme: Theme = themes[colorScheme];

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

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
          No notifications
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: theme.accent }]}
          onPress={() => {
            setRefreshing(true);
            fetchNotifications();
          }}
        >
          <Text style={[styles.retryText, { color: theme.accent }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemedView>
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            theme={theme}
            onPress={handleMarkRead}
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
