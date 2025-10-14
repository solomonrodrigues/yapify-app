// components/InitialsAvatar.tsx
import { Colors, ProfileColorHexMap } from "@/constants/Colors";
import { getInitials } from "@/lib/utils/user";
import { MinimalUser, ProfileColorEnum, PublicUser, User } from "@/types/api";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle, useColorScheme } from "react-native";

type InitialsAvatarProps = {
  user: User | PublicUser | MinimalUser;
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
          borderWidth: defaultBorder ? 0.5 : 0,
          borderColor: defaultBorder ? theme.avatarBorder : "transparent", // tweak color as needed
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.45 }]}>{getInitials(user)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: 'Sansation',
    color: "white",
    fontWeight: "bold",
  },
});
