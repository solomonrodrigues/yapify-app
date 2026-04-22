import { Colors } from '@/constants/Colors';
import { IconSymbol, type IconSymbolName } from "./ui/IconSymbol";
import { useGroups } from '@/context/GroupsContext';
import { respondToInvite } from '@/lib/api/groups';
import { GroupInviteReference, Notification } from '@/types/api';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { timeAgo } from "@/lib/utils/timeAgo";

interface NotificationItemProps {
  notification: Notification;
  theme: typeof Colors.light | typeof Colors.dark;
  onPress: () => void;
  onMarkUnread?: (id: number) => void;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const typeIconMap: Record<string, IconSymbolName | undefined> = {
  new_quote:             'quote.bubble',
  quote_liked:           'heart.fill',
  quote_witnessed:       'eye.fill',
  group_invite:          'person.badge.plus',
  group_invite_accepted: 'checkmark.circle.fill',
  quote_guessed:         'target',
  you_were_guessed:      'person.fill.viewfinder',
  quote_response:        'quote.bubble.fill',
};

const typeActionMap: Record<string, string> = {
  new_quote:             'posted a quote about you.',
  quote_liked:           'liked your quote.',
  quote_witnessed:       'witnessed your quote.',
  group_invite:          'invited you to a group.',
  group_invite_accepted: 'accepted your group invite.',
  quote_guessed:         'guessed your quote.',
  you_were_guessed:      'guessed it was you.',
  quote_response:        'responded to your quote.',
};

const ACTION_WIDTH = 72;

interface GroupInviteActionsProps {
  groupInvite: GroupInviteReference;
  theme: typeof Colors.light | typeof Colors.dark;
}

const GroupInviteActions: React.FC<GroupInviteActionsProps> = ({ groupInvite, theme }) => {
  const { refreshPendingInvites } = useGroups();
  const [loading, setLoading] = useState(false);
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(
    groupInvite.status !== 'pending' ? groupInvite.status : null
  );

  const handleRespond = async (action: 'accept' | 'decline') => {
    setLoading(true);
    try {
      await respondToInvite(groupInvite.id, action);
      setResponded(action === 'accept' ? 'accepted' : 'declined');
      refreshPendingInvites();
    } catch {
      // ignore — toast would be shown elsewhere
    } finally {
      setLoading(false);
    }
  };

  if (responded === 'accepted') {
    return (
      <View style={inviteStyles.statusPill}>
        <Text style={[inviteStyles.statusText, { color: theme.secondaryText }]}>Joined</Text>
      </View>
    );
  }

  if (responded === 'declined') {
    return (
      <View style={inviteStyles.statusPill}>
        <Text style={[inviteStyles.statusText, { color: theme.secondaryText }]}>Declined</Text>
      </View>
    );
  }

  if (loading) {
    return <ActivityIndicator size="small" color={theme.secondaryText} />;
  }

  return (
    <View style={inviteStyles.container}>
      <TouchableOpacity
        style={[inviteStyles.button, { backgroundColor: '#0095f6' }]}
        onPress={() => handleRespond('accept')}
        activeOpacity={0.7}
      >
        <Text style={inviteStyles.acceptText}>Accept</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[inviteStyles.button, { backgroundColor: theme.elevatedBackground, borderWidth: 1, borderColor: theme.cardBorder }]}
        onPress={() => handleRespond('decline')}
        activeOpacity={0.7}
      >
        <Text style={[inviteStyles.declineText, { color: theme.text }]}>Decline</Text>
      </TouchableOpacity>
    </View>
  );
};

const inviteStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  declineText: {
    fontWeight: '600',
    fontSize: 13,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  theme,
  onPress,
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
    group_invite,
  } = notification;

  const iconName = typeIconMap[notification_type] ?? 'bell';
  const typeColorMap: Record<string, { icon: string; bg: string }> = {
    new_quote:             { icon: theme.accent,        bg: theme.accent + '22' },
    quote_liked:           { icon: theme.likeButton,    bg: theme.likeButton + '22' },
    quote_witnessed:       { icon: theme.witnessButton, bg: theme.witnessButton + '22' },
    group_invite:          { icon: theme.friendColor,   bg: theme.friendColor + '22' },
    group_invite_accepted: { icon: theme.friendColor,   bg: theme.friendColor + '22' },
    quote_guessed:         { icon: theme.accent,        bg: theme.accent + '22' },
    you_were_guessed:      { icon: '#A135D2',           bg: '#A135D222' },
    quote_response:        { icon: '#E09520',           bg: '#E0952022' },
  };
  const iconColors = typeColorMap[notification_type] ?? { icon: theme.secondaryText, bg: theme.cardBackground };
  const actionText = typeActionMap[notification_type] ?? '';
  const isGroupInvite = notification_type === 'group_invite';
  const isNavigable = (
    notification_type === 'new_quote' ||
    notification_type === 'quote_liked' ||
    notification_type === 'quote_witnessed' ||
    notification_type === 'quote_guessed' ||
    notification_type === 'you_were_guessed' ||
    notification_type === 'quote_response'
  );

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
            <IconSymbol name={is_read ? 'eye.slash' : 'eye'} size={22} color="#fff" />
            <Text style={swipeStyles.actionLabel}>{is_read ? 'Unread' : 'Read'}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[swipeStyles.actionWrapper, { transform: [{ translateX: translateDelete }] }]}>
          <TouchableOpacity
            style={[swipeStyles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <IconSymbol name='trash' size={22} color="#fff" />
            <Text style={swipeStyles.actionLabel}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const groupInviteActionText = isGroupInvite && group_invite?.group
    ? `invited you to "${group_invite.group.name}".`
    : actionText;

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
              ? theme.elevatedBackground
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
            {' '}{isGroupInvite ? groupInviteActionText : actionText}
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
          {isGroupInvite && group_invite ? (
            <GroupInviteActions groupInvite={group_invite} theme={theme} />
          ) : isNavigable ? (
            <IconSymbol name="chevron.right" size={16} color={theme.secondaryText} />
          ) : null}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const swipeStyles = StyleSheet.create({
  actionsContainer: { flexDirection: 'row' },
  actionWrapper: { width: ACTION_WIDTH, alignSelf: 'stretch' },
  actionButton: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  actionLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
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
  body: { flex: 1, minHeight: 44 },
  primaryLine: { fontSize: 14, lineHeight: 18 },
  actorName: { fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  time: { fontSize: 12 },
  right: { marginLeft: 8, alignItems: 'flex-end', justifyContent: 'center' },
});
