import { IconSymbol } from "./ui/IconSymbol";
import { FriendButton } from "./FriendButton";
import { Friendship, MinimalUser, Notification } from '@/types/api';
import React, { useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { timeAgo } from "@/lib/utils/timeAgo";
import { formatNotificationParts } from "@/lib/utils/notifications";

// Individual Notification Component
interface NotificationItemProps {
  notification: Notification;
  theme: any;
  onPress: (id: number) => void;
  onFriendshipChange: (notificationId: number, friendship: Friendship | null) => void;
  onMarkUnread?: (id: number) => void;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
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

const ACTION_WIDTH = 72;

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  theme,
  onPress,
  onFriendshipChange,
  onMarkUnread,
  onMarkRead,
  onDelete,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

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

  const handleReadToggle = () => {
    if (is_read) {
      onMarkUnread?.(id);
    } else {
      onMarkRead?.(id);
    }
    swipeableRef.current?.close();
  };

  const handleDelete = () => {
    onDelete?.(id);
    swipeableRef.current?.close();
  };

  const TOTAL_WIDTH = ACTION_WIDTH * 2;

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateRead = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [TOTAL_WIDTH, 0],
      extrapolate: 'clamp',
    });
    const translateDelete = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [TOTAL_WIDTH, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={swipeStyles.actionsContainer}>
        <Animated.View style={[swipeStyles.actionWrapper, { transform: [{ translateX: translateRead }] }]}>
          <TouchableOpacity
            style={[swipeStyles.actionButton, { backgroundColor: '#007AFF' }]}
            onPress={handleReadToggle}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={is_read ? 'eye.slash' : 'eye'}
              size={22}
              color="#fff"
            />
            <Text style={swipeStyles.actionLabel}>
              {is_read ? 'Unread' : 'Read'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[swipeStyles.actionWrapper, { transform: [{ translateX: translateDelete }] }]}>
          <TouchableOpacity
            style={[swipeStyles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={'trash' as any}
              size={22}
              color="#fff"
            />
            <Text style={swipeStyles.actionLabel}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        style={[
          styles.notificationRow,
          {
            // Only highlight unread notifications
            backgroundColor: !is_read
              ? (theme.cardHighlight ?? theme.unreadBackground ?? theme.cardBackground)
              : theme.background ?? 'transparent',
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
    </Swipeable>
  );
};

const swipeStyles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
  },
  actionWrapper: {
    width: ACTION_WIDTH,
    alignSelf: 'stretch',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

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
