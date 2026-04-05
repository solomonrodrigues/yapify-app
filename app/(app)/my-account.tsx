// app/(app)/my-account.tsx
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors, ProfileColorHexMap } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@/context/UserContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ProfileColorEnum } from '@/types/api';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, Share, TextStyle, useColorScheme, View } from 'react-native';

type MenuItem = {
  title: string;
  icon: IconSymbolName;
  onPress: () => void;
  destructive?: boolean;
};

export default function MyAccountScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useUser();
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const profileColor = user?.profile_color
    ? ProfileColorHexMap[user.profile_color as ProfileColorEnum]
    : theme.accent;

  async function handleInvite() {
    if (!user?.username) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: `Join me on Yapify!\nhttps://yapify.net/invite/${user.username}/`,
    });
  }

  async function handleLogout() {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }

  const menuItems: MenuItem[] = [
    {
      title: "Edit Profile",
      icon: "person.crop.circle",
      onPress: () => router.push("/edit-profile"),
    },
    {
      title: "Invite Friends",
      icon: "paperplane",
      onPress: handleInvite,
    },
    {
      title: "Saved Quotes",
      icon: "bookmark",
      onPress: () => router.push("/saved-quotes"),
    },
    {
      title: "Privacy & Security",
      icon: "lock",
      onPress: () => router.push("/privacy-security"),
    },
    {
      title: "Help & Support",
      icon: "questionmark.circle.fill",
      onPress: () => router.push("/help-support"),
    },
    {
      title: "Log out",
      icon: "rectangle.portrait.and.arrow.right",
      onPress: handleLogout,
      destructive: true,
    },
  ];

  const profileHeader = user ? (
    <View style={styles.profileCard}>
      <View style={[styles.profileColorStrip, { backgroundColor: profileColor }]} />
      <View style={styles.profileBody}>
        <InitialsAvatar user={user} size={56} />
        <View style={styles.profileInfo}>
          <ThemedText style={styles.displayName}>{user.display_name}</ThemedText>
          <ThemedText style={styles.usernameText}>@{user.username}</ThemedText>
        </View>
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.title}
        ListHeaderComponent={profileHeader}
        renderItem={({ item }) => (
          <Pressable
            onPress={item.onPress}
            style={[
              styles.menuItem,
              item.destructive && styles.destructiveItem,
            ]}
          >
            <View style={styles.row}>
              <IconSymbol
                name={item.icon}
                color={item.destructive ? theme.destructive : theme.text}
                size={20}
                style={{ marginRight: 12 }}
              />
              <ThemedText
                style={[styles.menuText, item.destructive && styles.destructiveText]}
              >
                {item.title}
              </ThemedText>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  ({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    listContent: {
      paddingBottom: 20,
    },
    // Profile hero card
    profileCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      marginBottom: 20,
      overflow: 'hidden',
    },
    profileColorStrip: {
      height: 4,
    },
    profileBody: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 14,
    },
    profileInfo: {
      flex: 1,
    },
    displayName: {
      fontSize: 18,
      fontWeight: '700' as TextStyle['fontWeight'],
      color: theme.text,
      marginBottom: 2,
    },
    usernameText: {
      fontSize: 13,
      color: theme.secondaryText,
    },
    // Menu items
    menuItem: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
    },
    destructiveItem: {
      backgroundColor: theme.destructiveBackground,
    },
    menuText: {
      fontSize: 16,
      color: theme.text,
    },
    destructiveText: {
      color: theme.destructive,
      fontWeight: "600" as TextStyle["fontWeight"],
    },
    separator: {
      height: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
