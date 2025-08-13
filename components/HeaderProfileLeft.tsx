import React from "react";
import { Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";

type HeaderProfileLeftProps = {
  profileUri?: string;
  onPress?: () => void;
  size?: number;
};

export const HeaderProfileLeft: React.FC<HeaderProfileLeftProps> = ({
  profileUri = "https://randomuser.me/api/portraits/men/32.jpg",
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
      <Image
        source={{ uri: profileUri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2, borderColor }]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    borderWidth: 1,
    marginBottom: 10,
  },
});
