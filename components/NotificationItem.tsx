import { Colors } from '@/constants/Colors';
import { IconSymbol, type IconSymbolName } from "./ui/IconSymbol";
import { FriendButton } from "./FriendButton";
import { Friendship, Notification } from '@/types/api';
import React, { useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { timeAgo } from "@/lib/utils/timeAgo";

// Individual Notification Component
interface NotificationItemProps {
  notification: Notification;
  theme: typeof Colors.light | typeof Colors.dark;
  onPress: () => void;
  onFriendshipChange: (notificationId: number, friendship: Friendship | null) => void;
  onMarkUnread?: (id: number) => void;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}

// Map types to a small leading glyph
const typeIconMap: Record<string, IconSymbolName | undefined> = {
  new_quote: 'quote.bubble',
  quote_liked: 'heart.fill',
  quote_witnessed: 'eye.fill',
  friend_request: 'person',
  friend_accepted: 'checkmark.circle.fill',
};


const typeActionMap: Record<string, string> = {
  new_quote: 'posted a quote about you.',
  quote_liked: 'liked your quote.',
  quote_witnessed: 'witnessed your quote.',
  friend_request: 'sent you a friend request.',
  friend_accepted: 'accepted your friend request.',
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
    actors,
    is_read,
    last_event_at,
    notification_type,
    friendship,
  } = notification;

  const iconName = typeIconMap[notification_type] ?? 'bell';
  const typeColorMap: Record<string, { icon: string; bg: string }> = {
    new_quote:       { icon: theme.accent,        bg: theme.accent + '22' },
    quote_liked:     { icon: theme.likeButton,    bg: theme.likeButton + '22' },
    quote_witnessed: { icon: theme.witnessButton, bg: theme.witnessButton + '22' },
    friend_request:  { icon: theme.friendColor,   bg: theme.friendColor + '22' },
    friend_accepted: { icon: theme.friendColor,   bg: theme.friendColor + '22' },
  };
  const iconColors = typeColorMap[notification_type] ?? { icon: theme.secondaryText, bg: theme.cardBackground };
  const actionText = typeActionMap[notification_type] ?? '';
  const isFriendRequest = notification_type === 'friend_request';
  // For friend_request notifications the current user is the receiver; the actor is friendship.sender
  const friendUserId = friendship?.sender?.id;

  // actors is MinimalUser[] from the backend (schema type is inaccurate)
  type Actor = { id?: number; display_name?: string; username?: string };
  const actorArr: Actor[] = Array.isArray(actors)
    ? (actors as Actor[])
    : typeof actors === 'object' && actors !== null
    ? [actors as Actor]
    : [{ display_name: String(actors) }];

  const renderActorNames = () =>
    actorArr.map((actor, i) => {
      const name = actor.display_name ?? actor.username ?? '';
      const isLast = i === actorArr.length - 1;
      const suffix = isLast
        ? ''
        : actorArr.length === 2 || i < actorArr.length - 2
        ? (i === actorArr.length - 2 ? ' and ' : ', ')
        : ', and ';
      return (
        <React.Fragment key={actor.id ?? i}>
          <Text
            style={styles.actorName}
            onPress={actor.id !== undefined ? () => router.push({ pathname: '/user/[userID]', params: { userID: actor.id! } }) : undefined}
          >
            {name}
          </Text>
          {suffix}
        </React.Fragment>
      );
    });

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
              name='trash'
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
            backgroundColor: !is_read
              ? (theme.cardHighlight ?? theme.unreadBackground ?? theme.cardBackground)
              : theme.background ?? 'transparent',
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Left: type icon in a circle */}
        <View style={[styles.iconCircle, { backgroundColor: iconColors.bg }]}>
          <IconSymbol name={iconName} size={20} color={iconColors.icon} />
        </View>

        {/* Middle: Text block */}
        <View style={styles.body}>
          <Text style={[styles.primaryLine, { color: theme.text }]}>
            {renderActorNames()}
            {' '}{actionText}
          </Text>
          <View style={styles.metaRow}>
            {!is_read && (
              <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />
            )}
            <Text style={[styles.time, { color: theme.tertiaryText }]}>
              {timeAgo(last_event_at)}
            </Text>
          </View>
        </View>

        {/* Right: contextual action */}
        <View style={styles.right}>
          {isFriendRequest ? (
            friendUserId !== undefined && (
              <FriendButton
                userId={friendUserId}
                friendship={friendship ?? null}
                variant="inline"
                onFriendshipChange={(f) => onFriendshipChange(id, f)}
              />
            )
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
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  body: {
    flex: 1,
    minHeight: 44,
  },
  primaryLine: {
    fontSize: 14,
    lineHeight: 18,
  },
  actorName: {
    fontWeight: '700',
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
