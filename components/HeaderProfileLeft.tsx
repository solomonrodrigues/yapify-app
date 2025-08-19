import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { User } from "@/types/api";
import { InitialsAvatar } from "@/components/InitialsAvatar";

type HeaderProfileLeftProps = {
  user: User;
  onPress?: () => void;
  size?: number;
};

export const HeaderProfileLeft: React.FC<HeaderProfileLeftProps> = ({
  user,
  onPress,
  size = 30,
}) => {
  const router = useRouter();
  const borderColor = useThemeColor({}, "text"); // optional: theme-aware border

  return (
    <TouchableOpacity
      onPress={onPress || (() => router.push("/profile"))}
      style={{ marginLeft: 12 }}
    >
      <InitialsAvatar user={user} size={size} style={{marginBottom: 8}} />
    </TouchableOpacity>
  );
};
