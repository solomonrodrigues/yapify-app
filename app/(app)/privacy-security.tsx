// app/(app)/privacy-security.tsx
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  TextStyle,
  useColorScheme,
  View,
} from 'react-native';

type MenuItem = {
  title: string;
  subtitle?: string;
  icon: IconSymbolName;
  onPress: () => void;
  destructive?: boolean;
};

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const menuItems: MenuItem[] = [
    {
      title: 'Blocked Users',
      subtitle: 'Manage accounts you have blocked',
      icon: 'nosign',
      onPress: () => router.push('/blocked-users'),
    },
    {
      title: 'Hidden Quotes',
      subtitle: 'Manage quotes hidden from your feed',
      icon: 'eye.slash',
      onPress: () => router.push('/hidden-quotes'),
    },
    {
      title: 'Delete Account',
      subtitle: 'Permanently delete your account and data',
      icon: 'trash',
      onPress: () => router.push('/delete-account'),
      destructive: true,
    },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <Pressable
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.menuItem,
              item.destructive && styles.menuItemDestructive,
              pressed && styles.menuItemPressed,
            ]}
          >
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <IconSymbol
                  name={item.icon}
                  color={item.destructive ? theme.destructive : theme.text}
                  size={20}
                />
              </View>
              <View style={styles.textContainer}>
                <ThemedText style={[styles.menuText, item.destructive && styles.menuTextDestructive]}>
                  {item.title}
                </ThemedText>
                {item.subtitle && (
                  <ThemedText style={styles.subtitleText}>{item.subtitle}</ThemedText>
                )}
              </View>
              <IconSymbol
                name="chevron.right"
                color={theme.secondaryText}
                size={16}
              />
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
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
    menuItem: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
    },
    menuItemPressed: {
      opacity: 0.7,
    },
    menuItemDestructive: {
      backgroundColor: theme.destructiveBackground,
    },
    menuText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500' as TextStyle['fontWeight'],
    },
    menuTextDestructive: {
      color: theme.destructive,
    },
    subtitleText: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 2,
    },
    separator: {
      height: 12,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    iconContainer: {
      width: 32,
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
  });
