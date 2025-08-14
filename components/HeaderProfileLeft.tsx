import React from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { getInitials } from "@/utils/user"; // make sure to import this
import { User } from "@/types/api";
import { InitialsAvatar } from "@/components/InitialsAvatar";

type HeaderProfileLeftProps = {
  user: User | null;
  onPress?: () => void;
  size?: number;
};

export const HeaderProfileLeft: React.FC<HeaderProfileLeftProps> = ({
  user,
  onPress,
  size = 36,
}) => {
  const router = useRouter();
  const borderColor = useThemeColor({}, "text"); // optional: theme-aware border

  return (
    <TouchableOpacity
      onPress={onPress || (() => router.push("/profile"))}
      style={{ marginLeft: 12 }}
    >
      <InitialsAvatar initials={getInitials(user)} size={size} style={{marginBottom: 8}} />
    </TouchableOpacity>
  );
};

