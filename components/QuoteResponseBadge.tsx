import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface QuoteResponseBadgeProps {
  response: 'confirmed' | 'denied';
  displayName?: string;
  compact?: boolean;
}

/**
 * Elegant inline badge showing quote confirmation status.
 * Similar to Instagram's verified badge - minimal and integrated.
 */
const QuoteResponseBadge: React.FC<QuoteResponseBadgeProps> = ({
  response,
  displayName,
  compact = false,
}) => {
  const styles = useThemedStyles(getStyles);
  const isConfirmed = response === 'confirmed';

  const scale = useSharedValue(1);

  React.useEffect(() => {
    // Subtle pop-in animation
    scale.value = withSequence(
      withTiming(0.8, { duration: 0 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );
  }, [response]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (compact) {
    // Minimal badge with icon and colored text
    return (
      <Animated.View style={[styles.compactBadge, animatedStyle]}>
        <IconSymbol
          name={isConfirmed ? 'checkmark.seal.fill' : 'xmark.seal.fill'}
          size={14}
          color={isConfirmed ? '#34C759' : '#FF6B6B'}
        />
        <Text style={[styles.compactText, isConfirmed ? styles.compactTextConfirmed : styles.compactTextDenied]}>
          {isConfirmed ? 'Confirmed' : 'Disputed'}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.badge,
        isConfirmed ? styles.badgeConfirmed : styles.badgeDenied,
        animatedStyle,
      ]}
    >
      <IconSymbol
        name={isConfirmed ? 'checkmark.seal.fill' : 'xmark.seal.fill'}
        size={12}
        color="#fff"
      />
      <Text style={styles.badgeText}>
        {isConfirmed ? 'Confirmed' : 'Denied'}
        {displayName && !compact ? ` by ${displayName}` : ''}
      </Text>
    </Animated.View>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    badgeConfirmed: {
      backgroundColor: '#34C759',
    },
    badgeDenied: {
      backgroundColor: '#FF6B6B',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
      letterSpacing: 0.2,
    },
    compactBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 4,
      gap: 4,
    },
    compactText: {
      fontSize: 12,
      fontWeight: '600',
    },
    compactTextConfirmed: {
      color: '#34C759',
    },
    compactTextDenied: {
      color: '#FF6B6B',
    },
  });

export default QuoteResponseBadge;
