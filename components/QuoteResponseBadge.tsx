import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface QuoteResponseBadgeProps {
  response: 'confirmed' | 'denied';
}

const QuoteResponseBadge: React.FC<QuoteResponseBadgeProps> = ({ response }) => {
  const styles = useThemedStyles(getStyles);
  const isConfirmed = response === 'confirmed';

  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSequence(
      withTiming(0.92, { duration: 0 }),
      withTiming(1, { duration: 200 })
    );
  }, [response]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <IconSymbol
        name={isConfirmed ? 'checkmark.seal.fill' : 'xmark.seal.fill'}
        size={14}
        color={isConfirmed ? '#34C759' : '#FF6B6B'}
      />
      <Text style={[styles.text, isConfirmed ? styles.textConfirmed : styles.textDenied]}>
        {isConfirmed ? 'Confirmed' : 'Disputed'}
      </Text>
    </Animated.View>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 4,
      gap: 4,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
    },
    textConfirmed: {
      color: '#34C759',
    },
    textDenied: {
      color: '#FF6B6B',
    },
  });

export default QuoteResponseBadge;
