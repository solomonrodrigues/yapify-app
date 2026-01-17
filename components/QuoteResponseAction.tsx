import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
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

/**
 * Clean, modern toggle-style control for quoted users to confirm/deny a quote.
 * Inspired by iOS segmented controls with smooth animations.
 */
const QuoteResponseAction: React.FC<QuoteResponseActionProps> = ({
  currentResponse,
  onRespond,
}) => {
  const styles = useThemedStyles(getStyles);

  // Animation values for each button
  const confirmScale = useRef(new RNAnimated.Value(1)).current;
  const denyScale = useRef(new RNAnimated.Value(1)).current;

  // Shared values for color animations
  const confirmProgress = useSharedValue(currentResponse === 'confirmed' ? 1 : 0);
  const denyProgress = useSharedValue(currentResponse === 'denied' ? 1 : 0);

  React.useEffect(() => {
    confirmProgress.value = withTiming(currentResponse === 'confirmed' ? 1 : 0, { duration: 200 });
    denyProgress.value = withTiming(currentResponse === 'denied' ? 1 : 0, { duration: 200 });
  }, [currentResponse]);

  const handlePressIn = (scale: RNAnimated.Value) => {
    RNAnimated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = (scale: RNAnimated.Value) => {
    RNAnimated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onRespond(currentResponse === 'confirmed' ? null : 'confirmed');
  };

  const handleDeny = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onRespond(currentResponse === 'denied' ? null : 'denied');
  };

  const confirmAnimatedStyle = useAnimatedStyle(() => ({
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

  const denyAnimatedStyle = useAnimatedStyle(() => ({
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
      <View style={styles.buttonRow}>
        <RNAnimated.View style={{ transform: [{ scale: confirmScale }], flex: 1 }}>
          <AnimatedPressable
            onPressIn={() => handlePressIn(confirmScale)}
            onPressOut={() => handlePressOut(confirmScale)}
            onPress={handleConfirm}
            style={[styles.button, confirmAnimatedStyle]}
          >
            <IconSymbol
              name={isConfirmed ? 'checkmark.circle.fill' : 'checkmark.circle'}
              size={18}
              color={isConfirmed ? '#fff' : '#34C759'}
            />
            <Text style={[styles.buttonText, isConfirmed && styles.buttonTextActive]}>
              Yes
            </Text>
          </AnimatedPressable>
        </RNAnimated.View>

        <RNAnimated.View style={{ transform: [{ scale: denyScale }], flex: 1 }}>
          <AnimatedPressable
            onPressIn={() => handlePressIn(denyScale)}
            onPressOut={() => handlePressOut(denyScale)}
            onPress={handleDeny}
            style={[styles.button, denyAnimatedStyle]}
          >
            <IconSymbol
              name={isDenied ? 'xmark.circle.fill' : 'xmark.circle'}
              size={18}
              color={isDenied ? '#fff' : '#FF6B6B'}
            />
            <Text style={[styles.buttonText, styles.buttonTextDeny, isDenied && styles.buttonTextActive]}>
              No
            </Text>
          </AnimatedPressable>
        </RNAnimated.View>
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
      gap: 10,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
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
