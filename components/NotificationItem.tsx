import { IconSymbol } from "./ui/IconSymbol";
import { FriendButton } from "./FriendButton";
import { Friendship, MinimalUser, Notification } from '@/types/api';
import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { timeAgo } from "@/lib/utils/timeAgo";

// Individual Notification Component
interface NotificationItemProps {
  notification: Notification;
  theme: any;
  onPress: (id: number) => void;
  onFriendshipChange: (notificationId: number, friendship: Friendship | null) => void;
}

// Map types to a small leading glyph
const typeIconMap: Record<string, string | undefined> = {
    new_quote: 'quote.bubble',
    quote_liked: 'hand.thumbsup',
    quote_witnessed: 'eye',
    friend_request: 'person.badge.plus',
    friend_accepted: 'checkmark.circle',
    system: 'bell',
};
  
export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, theme, onPress, onFriendshipChange }) => {
    const { id, sender, title, message, is_read, created_at, notification_type, friendship } = notification;
  
    const iconName = typeIconMap[notification_type] ?? 'bell';
  
    return (
      <TouchableOpacity
        style={[
          styles.notificationRow,
          { backgroundColor: theme.cardBackground, borderColor: theme.border, opacity: is_read ? 0.7 : 1 },
        ]}
        onPress={() => onPress(id)}
        activeOpacity={0.85}
      >
        {/* Left: Avatar */}
        <InitialsAvatar user={sender as MinimalUser} size={44} style={styles.avatar} />
  
        {/* Middle: Text */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            {iconName ? <IconSymbol name={iconName as any} size={14} color={theme.secondaryText} style={{ marginRight: 6 }} /> : null}
            <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>{title}</Text>
          </View>
          <Text numberOfLines={2} style={[styles.message, { color: theme.secondaryText }]}>{message}</Text>
  
          <View style={styles.metaRow}>
            {!is_read && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
            <Text style={[styles.time, { color: theme.tertiaryText }]}>{timeAgo(created_at)}</Text>
          </View>
        </View>
  
        {/* Right: Contextual action */}
        <View style={styles.right}>
          {notification_type === 'friend_request' ? (
            <FriendButton
              userId={sender.id}
              friendship={friendship ?? null}
              variant="inline"
              showIcon={false}
              onFriendshipChange={(f) => onFriendshipChange(notification.id, f)}
            />
          ) : (
            // Chevron for navigable notifications
            <IconSymbol name="chevron.right" size={16} color={theme.secondaryText} />
          )}
        </View>
      </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    notificationRow: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      marginRight: 12,
    },
    body: {
      flex: 1,
      minHeight: 48,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
    },
    message: {
      fontSize: 14,
    },
    metaRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    time: {
      fontSize: 12,
    },
    right: {
      marginLeft: 12,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
  });
  