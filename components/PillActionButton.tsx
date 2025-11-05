import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import * as Haptics from 'expo-haptics';

interface PillActionButtonProps {
  icon: React.ReactNode;
  label: string | number;
  color: string;
  onPress: () => void;
  highlighted?: boolean;
  testID?: string;
}

const PillActionButton: React.FC<PillActionButtonProps> = ({
  icon,
  label,
  color,
  onPress,
  highlighted = false,
  testID,
}) => {
  const styles = useThemedStyles(getStyles);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { 
      toValue: 0.96, 
      useNativeDriver: true, 
      speed: 20, 
      bounciness: 6 
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { 
      toValue: 1, 
      useNativeDriver: true, 
      speed: 20, 
      bounciness: 6 
    }).start();
  };

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        testID={testID}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        hitSlop={8}
        style={({ pressed }) => [
          styles.actionPill,
          {
            backgroundColor: highlighted || pressed ? `${color}10` : 'transparent',
            borderColor: highlighted ? color : 'rgba(255, 255, 255, 0.15)',
          },
        ]}
      >
        {icon}
        <Text style={[styles.actionText, { color }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
    StyleSheet.create({
        actionPill: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 18,
            borderWidth: 1,
        },
        actionText: {
            fontSize: 14,
            fontWeight: '600',
        },
    }
);

export default PillActionButton;
