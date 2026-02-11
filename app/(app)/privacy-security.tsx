// app/(app)/privacy-security.tsx
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { QuoteVisibilityEnum } from '@/types/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextStyle,
  useColorScheme,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

type MenuItem = {
  title: string;
  subtitle?: string;
  icon: IconSymbolName;
  onPress: () => void;
};

const QUOTE_VISIBILITY_OPTIONS: { value: QuoteVisibilityEnum; label: string; description: string }[] = [
  {
    value: 'mutuals',
    label: 'Mutual Friends Only',
    description: 'Only mutual friends can see your quotes',
  },
  {
    value: 'extended',
    label: 'Friends of Friends',
    description: 'Your friends and their friends can see your quotes',
  },
];

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const [saving, setSaving] = useState(false);

  const currentVisibility = (user?.quote_visibility as QuoteVisibilityEnum) || 'mutuals';

  const handleVisibilityChange = async (value: QuoteVisibilityEnum) => {
    if (value === currentVisibility || saving) return;

    try {
      setSaving(true);
      await updateUser({ quote_visibility: value });
      Toast.show({
        type: 'success',
        text1: 'Visibility updated',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update visibility',
      });
    } finally {
      setSaving(false);
    }
  };

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
  ];

  return (
    <View style={styles.container}>
      {/* Quote Visibility Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name="eye" size={20} color={theme.text} />
          <ThemedText style={styles.sectionTitle}>Quote Visibility</ThemedText>
          {saving && <ActivityIndicator size="small" style={styles.savingIndicator} />}
        </View>
        <ThemedText style={styles.sectionDescription}>
          Control who can see quotes you are tagged in
        </ThemedText>
        <View style={styles.optionsContainer}>
          {QUOTE_VISIBILITY_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionCard,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.cardBackground,
                },
                currentVisibility === option.value && {
                  borderColor: theme.accent,
                  backgroundColor: theme.accent + '10',
                },
              ]}
              onPress={() => handleVisibilityChange(option.value)}
              disabled={saving}
            >
              <View style={styles.optionHeader}>
                <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
                {currentVisibility === option.value && (
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={20}
                    color={theme.accent}
                  />
                )}
              </View>
              <ThemedText style={styles.optionDescription}>
                {option.description}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <Pressable
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
          >
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <IconSymbol
                  name={item.icon}
                  color={theme.text}
                  size={20}
                />
              </View>
              <View style={styles.textContainer}>
                <ThemedText style={styles.menuText}>{item.title}</ThemedText>
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
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as TextStyle['fontWeight'],
      color: theme.text,
    },
    savingIndicator: {
      marginLeft: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.secondaryText,
      marginBottom: 16,
      lineHeight: 20,
    },
    optionsContainer: {
      gap: 12,
    },
    optionCard: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
    },
    optionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 4,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600' as TextStyle['fontWeight'],
      color: theme.text,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.secondaryText,
      lineHeight: 20,
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
    menuText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500' as TextStyle['fontWeight'],
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
