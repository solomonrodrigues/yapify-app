// app/(app)/menu.tsx
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, TextStyle, View } from 'react-native';

type MenuItem = {
  title: string;
  onPress: () => void;
  destructive?: boolean;
};

export default function MenuScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const styles = useThemedStyles(getStyles);

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
      title: "Account Settings",
      onPress: () => router.push("/profile"), // placeholder route
    },
    {
      title: "Notifications",
      onPress: () => router.push("/profile"), // placeholder route
    },
    {
      title: "Privacy & Security",
      onPress: () => router.push("/profile"), // placeholder route
    },
    {
      title: "Help & Support",
      onPress: () => router.push("/profile"), // placeholder route
    },
    {
      title: "Onboarding",
      onPress: () => router.push("/onboarding"), // placeholder route
    },
    {
      title: "Log out",
      onPress: handleLogout,
      destructive: true,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Menu List */}
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <Pressable
            onPress={item.onPress}
            style={[
              styles.menuItem,
              item.destructive && styles.destructiveItem,
            ]}
          >
            <ThemedText
              style={[styles.menuText, item.destructive && styles.destructiveText]}
            >
              {item.title}
            </ThemedText>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    backButton: {
      paddingVertical: 8,
      paddingRight: 16,
    },
    backText: {
      color: theme.primary,
      fontWeight: "500",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 20,
      fontWeight: "600",
      color: theme.text,
      marginRight: 32, // so it's centered despite back button
    },
    listContent: {
      paddingBottom: 20,
    },
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
  });
