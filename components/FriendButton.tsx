// components/FriendButton.tsx
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { respondToFriendRequest, cancelFriendRequest, sendFriendRequest, unfriend } from '@/lib/api/friends';
import type { Friendship } from '@/types/api';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

type FriendAction = 'add' | 'cancel' | 'unfriend' | 'accept' | 'reject';

interface FriendButtonProps {
  userId: number;
  friendship: Friendship | null;
  onFriendshipChange?: (friendship: Friendship | null) => void;
  variant?: 'default' | 'compact' | 'inline';
  showIcon?: boolean;
}

export const FriendButton: React.FC<FriendButtonProps> = ({
  userId,
  friendship,
  onFriendshipChange,
  variant = 'default',
  showIcon = true,
}) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const [localFriendship, setLocalFriendship] = useState(friendship);
  const [loading, setLoading] = useState(false);

  const currentFriendship = friendship ?? localFriendship;

  const handleAction = async (action: FriendAction) => {
    setLoading(true);
    try {
      let result: Friendship | null = null;

      switch (action) {
        case 'add':
          const addRes = await sendFriendRequest(userId);
          result = addRes.friendship;
          break;
        case 'cancel':
          await cancelFriendRequest(userId);
          result = null;
          break;
        case 'unfriend':
          await unfriend(userId);
          result = null;
          break;
        case 'accept':
          const acceptRes = await respondToFriendRequest(userId, 'accept');
          result = acceptRes.friendship;
          break;
        case 'reject':
          await respondToFriendRequest(userId, 'reject');
          result = null;
          break;
      }

      setLocalFriendship(result);
      onFriendshipChange?.(result);
    } catch (err) {
      console.error(`Failed to ${action} friend:`, err);
    } finally {
      setLoading(false);
    }
  };

  const getButtonConfig = (): {
    text: string;
    style: any;
    textStyle: any;
    action?: FriendAction;
    icon?: string;
  } => {
    if (!currentFriendship) {
      return {
        text: variant === 'compact' ? 'Add' : 'Add Friend',
        style: { backgroundColor: '#0095f6' },
        textStyle: { color: '#ffffff', fontWeight: '600' as const },
        action: 'add',
        icon: 'person.badge.plus',
      };
    }

    // Check if current user is the one who received the request
    const isIncoming = currentFriendship.status === 'pending' && currentFriendship.receiver.id === userId;

    switch (currentFriendship.status) {
      case 'pending':
        if (isIncoming) {
          // This is handled by AcceptRejectButtons for inline variant
          return {
            text: 'Requested',
            style: { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.divider },
            textStyle: { color: theme.text, fontWeight: '600' as const },
            action: 'cancel',
            icon: 'clock',
          };
        } else {
          return {
            text: 'Requested',
            style: { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.divider },
            textStyle: { color: theme.text, fontWeight: '600' as const },
            action: 'cancel',
            icon: 'clock',
          };
        }
      case 'accepted':
        return {
          text: variant === 'compact' ? 'Friends' : 'Friends',
          style: { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: '#4ade80' },
          textStyle: { color: '#4ade80', fontWeight: '600' as const },
          action: 'unfriend',
          icon: 'checkmark.circle.fill',
        };
      case 'rejected':
        return {
          text: 'Declined',
          style: { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.divider, opacity: 0.5 },
          textStyle: { color: theme.secondaryText, fontWeight: '600' as const },
        };
      case 'blocked':
        return {
          text: 'Blocked',
          style: { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.divider, opacity: 0.5 },
          textStyle: { color: theme.secondaryText, fontWeight: '600' as const },
        };
      default:
        return {
          text: 'Add Friend',
          style: { backgroundColor: '#0095f6' },
          textStyle: { color: '#ffffff', fontWeight: '600' as const },
          action: 'add',
          icon: 'person.badge.plus',
        };
    }
  };

  // Check if this is an incoming friend request
  const isIncomingRequest = currentFriendship?.status === 'pending' && 
    currentFriendship.receiver.id !== userId;

  // For inline variant with incoming request, show accept/reject buttons
  if (variant === 'inline' && isIncomingRequest) {
    return (
      <AcceptRejectButtons
        onAccept={() => handleAction('accept')}
        onReject={() => handleAction('reject')}
        loading={loading}
        theme={theme}
      />
    );
  }

  const config = getButtonConfig();
  const buttonSize = variant === 'compact' ? 'small' : variant === 'inline' ? 'inline' : 'default';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonSize === 'small' && styles.buttonSmall,
        buttonSize === 'inline' && styles.buttonInline,
        config.style,
      ]}
      onPress={() => config.action && handleAction(config.action)}
      disabled={!config.action || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={config.action === 'add' ? '#fff' : theme.text} />
      ) : (
        <View style={styles.buttonContent}>
          {showIcon && config.icon && (
            <IconSymbol
              name={config.icon as any}
              size={buttonSize === 'inline' ? 14 : 16}
              color={config.textStyle.color}
              style={styles.buttonIcon}
            />
          )}
          <ThemedText style={[config.textStyle, buttonSize === 'inline' && styles.textInline]}>
            {config.text}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Separate component for accept/reject buttons
interface AcceptRejectButtonsProps {
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
  theme: any;
}

const AcceptRejectButtons: React.FC<AcceptRejectButtonsProps> = ({
  onAccept,
  onReject,
  loading,
  theme,
}) => {
  return (
    <View style={styles.acceptRejectContainer}>
      <TouchableOpacity
        style={[styles.acceptButton, { backgroundColor: '#0095f6' }]}
        onPress={onAccept}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.rejectButton, { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.divider }]}
        onPress={onReject}
        disabled={loading}
        activeOpacity={0.7}
      >
        <ThemedText style={[styles.rejectButtonText, { color: theme.text }]}>Decline</ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 32,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  buttonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    minWidth: 100,
    minHeight: 32,
  },
  buttonInline: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 90,
    minHeight: 32,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonIcon: {
    marginRight: 2,
  },
  textInline: {
    fontSize: 14,
  },
  acceptRejectContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
