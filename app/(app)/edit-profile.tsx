import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, ProfileColorHexMap } from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { updateProfile } from '@/lib/api/profile';
import { getErrorMessage } from '@/lib/utils/error';
import { ProfileColorEnum } from '@/types/api';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

// Generate profile color options from the hex map
const PROFILE_COLORS: { value: ProfileColorEnum; hex: string; name: string }[] = (
  Object.keys(ProfileColorHexMap) as ProfileColorEnum[]
).map((colorKey) => ({
  value: colorKey,
  hex: ProfileColorHexMap[colorKey],
  name: colorKey.charAt(0) + colorKey.slice(1).toLowerCase(), // Capitalize first letter
}));

export default function EditProfileScreen() {
  const { user, updateUser } = useUser();
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [bio, setBio] = useState(user?.bio || '');
  const [profileColor, setProfileColor] = useState<ProfileColorEnum>(
    (user?.profile_color as ProfileColorEnum) || 'PURPLE'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      // Use updateUser from context which automatically updates the context state
      await updateUser({
        bio: bio || null,
        profile_color: profileColor,
      });

      Toast.show({
        type: 'success',
        text1: 'Profile updated',
        text2: 'Your changes have been saved',
      });
    } catch (error) {
      const message = getErrorMessage(error);
      Alert.alert('Error', message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const hasChanges =
    bio !== (user.bio || '') ||
    profileColor !== user.profile_color;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bio Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="text.alignleft" size={20} color={theme.text} />
            <ThemedText style={styles.sectionTitle}>Bio</ThemedText>
          </View>
          <TextInput
            style={[styles.bioInput, { color: theme.text, borderColor: theme.border }]}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.secondaryText}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={160}
            textAlignVertical="top"
          />
          <ThemedText style={styles.charCount}>
            {bio.length}/160 characters
          </ThemedText>
        </View>

        {/* Profile Color Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="paintpalette" size={20} color={theme.text} />
            <ThemedText style={styles.sectionTitle}>Profile Color</ThemedText>
          </View>
          <ThemedText style={styles.sectionDescription}>
            Choose your profile accent color
          </ThemedText>
          <View style={styles.colorsGrid}>
            {PROFILE_COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: color.hex,
                    borderColor: theme.border,
                  },
                  profileColor === color.value && styles.colorOptionSelected,
                ]}
                onPress={() => setProfileColor(color.value)}
                activeOpacity={0.7}
              >
                {profileColor === color.value && (
                  <IconSymbol
                    name="checkmark"
                    size={24}
                    color={color.value === 'WHITE' || color.value === 'YELLOW' ? '#000' : '#FFF'}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <ThemedText style={styles.selectedColorText}>
            Selected: {PROFILE_COLORS.find((c) => c.value === profileColor)?.name}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View style={[styles.saveButtonContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accent }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.secondaryText,
      marginBottom: 16,
      lineHeight: 20,
    },
    bioInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      minHeight: 120,
      backgroundColor: theme.cardBackground,
    },
    charCount: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 8,
      textAlign: 'right',
    },
    colorsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 3,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorOptionSelected: {
      borderColor: '#FFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    selectedColorText: {
      fontSize: 14,
      color: theme.secondaryText,
      marginTop: 16,
      textAlign: 'center',
    },
    saveButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    saveButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFF',
    },
  });
