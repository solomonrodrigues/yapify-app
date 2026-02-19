// GuessButton.tsx
import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View, Animated } from "react-native";
import * as Haptics from "expo-haptics";

type GuessButtonProps = {
  color: string;
  title?: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean; // optional external control
  testID?: string;
  // If you're using your own icon component (e.g., IconSymbol), pass it in
  icon?: React.ReactNode;
};

export default function GuessButton({
  color,
  title = "Guess",
  onPress,
  disabled = false,
  loading,
  testID,
  icon,
}: GuessButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isBusy = loading ?? internalLoading;

  const scale = useRef(new Animated.Value(1)).current;

  const borderColor = color;
  const textColor = color;
  const ripple = useMemo(
    () =>
      Platform.select({
        android: { color: `${color}33`, borderless: false },
        default: undefined,
      }),
    [color]
  );

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };

  const handlePress = async () => {
    if (disabled || isBusy) return;
    Haptics.selectionAsync().catch(() => {});
    try {
      const maybePromise = onPress();
      if (maybePromise && typeof (maybePromise as { then?: unknown }).then === "function" && loading === undefined) {
        setInternalLoading(true);
        await maybePromise;
      }
    } finally {
      if (loading === undefined) setInternalLoading(false);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}>
      <Pressable
        testID={testID}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || isBusy}
        android_ripple={ripple}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint="Opens the guess modal"
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            borderWidth: 1.5,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderColor,
            backgroundColor: pressed ? `${color}12` : "transparent",
          },
        ]}
      >
        {isBusy ? (
          <View style={{ paddingHorizontal: 2 }}>
            <ActivityIndicator size="small" />
          </View>
        ) : (
          <>
            <Text style={{ fontWeight: "600", paddingRight: 6, color: textColor }}>{title}</Text>
            {icon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
