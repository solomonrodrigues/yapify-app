import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import * as Haptics from 'expo-haptics';

interface QuoteResponseActionProps {
  currentResponse: 'confirmed' | 'denied' | null;
  onRespond: (response: 'confirmed' | 'denied' | null) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GAP = 10;
const TIMING_CONFIG = { duration: 300, easing: Easing.out(Easing.cubic) };

/**
 * Toggle-style control for quoted users to confirm/deny a quote.
 * The selected button expands to fill the row, covering the other option.
 */
const QuoteResponseAction: React.FC<QuoteResponseActionProps> = ({
  currentResponse,
  onRespond,
}) => {
  const styles = useThemedStyles(getStyles);
  const [rowWidth, setRowWidth] = useState(0);

  // -1 = denied selected, 0 = neutral, 1 = confirmed selected
  const selection = useSharedValue(
    currentResponse === 'confirmed' ? 1 : currentResponse === 'denied' ? -1 : 0
  );

  // Color progress for each button (0 = inactive, 1 = active)
  const confirmProgress = useSharedValue(currentResponse === 'confirmed' ? 1 : 0);
  const denyProgress = useSharedValue(currentResponse === 'denied' ? 1 : 0);

  React.useEffect(() => {
    const target = currentResponse === 'confirmed' ? 1 : currentResponse === 'denied' ? -1 : 0;
    selection.value = withTiming(target, TIMING_CONFIG);
    confirmProgress.value = withTiming(currentResponse === 'confirmed' ? 1 : 0, { duration: 200 });
    denyProgress.value = withTiming(currentResponse === 'denied' ? 1 : 0, { duration: 200 });
  }, [currentResponse]);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onRespond(currentResponse === 'confirmed' ? null : 'confirmed');
  };

  const handleDeny = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onRespond(currentResponse === 'denied' ? null : 'denied');
  };

  const halfWidth = (rowWidth - GAP) / 2;

  // Confirm button: full width when selected, half at rest, 0 when other selected
  const confirmWrapperStyle = useAnimatedStyle(() => {
    const w = interpolate(selection.value, [-1, 0, 1], [0, halfWidth, rowWidth]);
    return {
      width: w,
      opacity: interpolate(selection.value, [-1, -0.5, 0], [0, 0.5, 1]),
    };
  });

  // Animated gap: collapses when either button takes full width
  const gapStyle = useAnimatedStyle(() => {
    const g = interpolate(Math.abs(selection.value), [0, 0.8, 1], [GAP, GAP * 0.3, 0]);
    return { width: g };
  });

  // Deny button: full width when selected, half at rest, 0 when other selected
  const denyWrapperStyle = useAnimatedStyle(() => {
    const w = interpolate(selection.value, [-1, 0, 1], [rowWidth, halfWidth, 0]);
    return {
      width: w,
      opacity: interpolate(selection.value, [0, 0.5, 1], [1, 0.5, 0]),
    };
  });

  const confirmButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      confirmProgress.value,
      [0, 1],
      ['transparent', '#34C759']
    ),
    borderColor: interpolateColor(
      confirmProgress.value,
      [0, 1],
      ['#34C75940', '#34C759']
    ),
  }));

  const denyButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      denyProgress.value,
      [0, 1],
      ['transparent', '#FF6B6B']
    ),
    borderColor: interpolateColor(
      denyProgress.value,
      [0, 1],
      ['#FF6B6B40', '#FF6B6B']
    ),
  }));

  const isConfirmed = currentResponse === 'confirmed';
  const isDenied = currentResponse === 'denied';

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Did you say this?</Text>
      <View
        style={styles.buttonRow}
        onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
      >
        {rowWidth > 0 && (
          <>
            <Animated.View style={[styles.buttonWrapper, confirmWrapperStyle]}>
              <AnimatedPressable
                onPress={handleConfirm}
                style={[styles.button, confirmButtonStyle]}
              >
                <IconSymbol
                  name={isConfirmed ? 'checkmark.circle.fill' : 'checkmark.circle'}
                  size={18}
                  color={isConfirmed ? '#fff' : '#34C759'}
                />
                <Text numberOfLines={1} style={[styles.buttonText, isConfirmed && styles.buttonTextActive]}>
                  Yes
                </Text>
              </AnimatedPressable>
            </Animated.View>

            <Animated.View style={gapStyle} />

            <Animated.View style={[styles.buttonWrapper, denyWrapperStyle]}>
              <AnimatedPressable
                onPress={handleDeny}
                style={[styles.button, denyButtonStyle]}
              >
                <IconSymbol
                  name={isDenied ? 'xmark.circle.fill' : 'xmark.circle'}
                  size={18}
                  color={isDenied ? '#fff' : '#FF6B6B'}
                />
                <Text numberOfLines={1} style={[styles.buttonText, styles.buttonTextDeny, isDenied && styles.buttonTextActive]}>
                  No
                </Text>
              </AnimatedPressable>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      marginVertical: 12,
    },
    prompt: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.secondaryText,
      marginBottom: 10,
      letterSpacing: 0.1,
    },
    buttonRow: {
      flexDirection: 'row',
    },
    buttonWrapper: {
      overflow: 'hidden',
      minWidth: 0,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 46,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#34C759',
    },
    buttonTextDeny: {
      color: '#FF6B6B',
    },
    buttonTextActive: {
      color: '#fff',
    },
  });

export default QuoteResponseAction;
