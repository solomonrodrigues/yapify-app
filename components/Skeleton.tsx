import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 4, style }: SkeletonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.ease }),
      -1,
      true
    );
  }, []);

  const baseColor = colorScheme === 'dark' ? '#1e1e1e' : '#e5e5e5';
  const highlightColor = colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0';

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolate(shimmer.value, [0, 1], [0, 1]) > 0.5
      ? highlightColor
      : baseColor,
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.6, 1, 0.6]),
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Skeleton card that mimics a FeedQuote layout */
export function SkeletonQuoteCard() {
  return (
    <View style={skeletonStyles.quoteCard}>
      {/* Header: author quoted name */}
      <View style={skeletonStyles.headerRow}>
        <Skeleton width={80} height={14} borderRadius={7} />
        <Skeleton width={50} height={14} borderRadius={7} style={{ marginLeft: 6 }} />
        <Skeleton width={70} height={14} borderRadius={7} style={{ marginLeft: 6 }} />
      </View>

      {/* Quote text lines */}
      <View style={skeletonStyles.textBlock}>
        <Skeleton width="100%" height={22} borderRadius={6} />
        <Skeleton width="85%" height={22} borderRadius={6} style={{ marginTop: 8 }} />
        <Skeleton width="60%" height={22} borderRadius={6} style={{ marginTop: 8 }} />
      </View>

      {/* Action buttons */}
      <View style={skeletonStyles.actionsRow}>
        <Skeleton width={70} height={30} borderRadius={15} />
        <Skeleton width={110} height={30} borderRadius={15} style={{ marginLeft: 10 }} />
        <Skeleton width={80} height={30} borderRadius={15} style={{ marginLeft: 10 }} />
      </View>

      {/* Divider */}
      <View style={skeletonStyles.divider} />
    </View>
  );
}

/** Skeleton for a notification item */
export function SkeletonNotificationItem() {
  return (
    <View style={skeletonStyles.notificationItem}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={skeletonStyles.notificationText}>
        <Skeleton width="80%" height={14} borderRadius={7} />
        <Skeleton width="50%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/** Skeleton for a user list item (friend list in post modal) */
export function SkeletonUserItem() {
  return (
    <View style={skeletonStyles.userItem}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={skeletonStyles.userItemText}>
        <Skeleton width={120} height={14} borderRadius={7} />
        <Skeleton width={80} height={12} borderRadius={6} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  quoteCard: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  textBlock: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.15)',
    marginTop: 10,
    marginHorizontal: -16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  userItemText: {
    marginLeft: 12,
    flex: 1,
  },
});
