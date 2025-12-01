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
import { formatNotificationParts } from "@/lib/utils/notifications";

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

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  theme,
  onPress,
  onFriendshipChange,
}) => {
  const {
    id,
    sender,
    title,
    message,
    is_read,
    created_at,
    notification_type,
    friendship,
  } = notification;

  const iconName = typeIconMap[notification_type] ?? 'bell';

  const { actor, action, object } = formatNotificationParts(
    notification_type,
    sender,
    { fallbackText: message ?? "" }
  );

  const isFriendRequest = notification_type === 'friend_request';

  return (
    <TouchableOpacity
      style={[
        styles.notificationRow,
        {
          // Only highlight unread notifications
          backgroundColor: !is_read
            ? (theme.cardHighlight ?? theme.unreadBackground ?? theme.cardBackground)
            : 'transparent',
        },
      ]}
      onPress={() => onPress(id)}
      activeOpacity={0.7}
    >
      {/* Left: Avatar + type icon badge */}
      <View style={styles.left}>
        <View style={styles.avatarWrapper}>
          <InitialsAvatar
            user={sender as MinimalUser}
            size={44}
            style={styles.avatar}
          />
          {iconName && (
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: theme.background },
              ]}
            >
              <IconSymbol
                name={iconName as any}
                size={12}
                color={theme.secondaryText}
              />
            </View>
          )}
        </View>
      </View>

      {/* Middle: Text block */}
      <View style={styles.body}>
        <Text style={[styles.primaryLine, { color: theme.text }]}>
          <Text style={styles.senderName}>{actor}</Text>
          {" "}{action}
          {object ? " " + object : ""}
        </Text>

        <View style={styles.metaRow}>
          {!is_read && (
            <View
              style={[
                styles.unreadDot,
                { backgroundColor: theme.accent },
              ]}
            />
          )}
          <Text style={[styles.time, { color: theme.tertiaryText }]}>
            {timeAgo(created_at)}
          </Text>
        </View>
      </View>

      {/* Right: contextual action */}
      <View style={styles.right}>
        {isFriendRequest ? (
          <FriendButton
            userId={(sender as MinimalUser).id}
            friendship={friendship ?? null}
            variant="inline"
            showIcon={false}
            onFriendshipChange={(f) => onFriendshipChange(notification.id, f)}
          />
        ) : (
          <IconSymbol
            name="chevron.right"
            size={16}
            color={theme.secondaryText}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    // full-width row look; separators handled by FlatList/itemSeparator
  },
  left: {
    marginRight: 10,
  },
  avatarWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {},
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 999,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  body: {
    flex: 1,
    minHeight: 44,
  },
  primaryLine: {
    fontSize: 14,
    lineHeight: 18,
  },
  senderName: {
    fontWeight: '700',
  },
  secondaryLine: {
    fontSize: 13,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  time: {
    fontSize: 12,
  },
  right: {
    marginLeft: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
