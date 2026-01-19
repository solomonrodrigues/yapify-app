// app/(app)/menu.tsx
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, TextStyle, useColorScheme, View } from 'react-native';

type MenuItem = {
  title: string;
  icon: IconSymbolName;
  onPress: () => void;
  destructive?: boolean;
};

export default function MyAccountScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

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
      title: "Onboarding",
      icon: "sparkles",
      onPress: () => router.push("/onboarding"),
    },
    {
      title: "Log out",
      icon: "xmark.circle.fill",
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
    row: {
      flexDirection: "row",
      alignItems: "center",
    },    
  });
