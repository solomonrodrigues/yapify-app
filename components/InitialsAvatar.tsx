// components/InitialsAvatar.tsx
import { Colors, ProfileColorHexMap } from "@/constants/Colors";
import { User, PublicUser, ProfileColorEnum } from "@/types/api";
import { getInitials } from "@/utils/user";
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle, useColorScheme } from "react-native";

type InitialsAvatarProps = {
  user: User | PublicUser;
  size?: number;
  style?: StyleProp<ViewStyle>;
  defaultBorder?: boolean;
};

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  user,
  size = 36,
  style,
  defaultBorder = true,
}) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme]

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ProfileColorHexMap[user.profile_color as ProfileColorEnum],
          borderWidth: defaultBorder ? 1.5 : 0,
          borderColor: defaultBorder ? theme.avatarBorder : "transparent", // tweak color as needed
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials(user)}</Text>
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
