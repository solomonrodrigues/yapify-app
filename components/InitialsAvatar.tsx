// components/InitialsAvatar.tsx
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";

type InitialsAvatarProps = {
  initials: string;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  initials,
  color = "#4A90E2", // default color
  size = 36,
  style,
}) => {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "white",
    fontWeight: "bold",
  },
});
