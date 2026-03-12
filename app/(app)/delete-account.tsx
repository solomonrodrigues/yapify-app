import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api/errors';
import { deleteAccount } from '@/lib/api/profile';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CONFIRMATION_WORD = 'DELETE';
const COUNTDOWN_SECONDS = 10;

export default function DeleteAccountScreen() {
  const { logout } = useAuth();
  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [inputValue, setInputValue] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConfirmed = inputValue === CONFIRMATION_WORD;
  const isReady = isConfirmed && countdown === 0;

  useEffect(() => {
    if (isConfirmed && countdown === null) {
      setCountdown(COUNTDOWN_SECONDS);
    } else if (!isConfirmed) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(null);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (countdown === null || countdown === 0) return;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [countdown !== null && countdown > 0 ? 'running' : 'stopped']);

  async function handleDelete() {
    if (!isReady || isDeleting) return;

    Alert.alert(
      'Last chance',
      'This cannot be undone. Your account and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount();
              await logout();
            } catch (err) {
              setIsDeleting(false);
              Alert.alert('Error', getErrorMessage(err));
            }
          },
        },
      ]
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(40, insets.bottom + 24) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* What gets deleted */}
          <View style={styles.infoCard}>
            <ThemedText style={styles.infoTitle}>What will be deleted</ThemedText>
            <ThemedText style={styles.infoText}>
              Your profile, posted quotes, friendships, saved quotes, and all other account data will be permanently removed.
            </ThemedText>
            <View style={styles.divider} />
            <ThemedText style={styles.infoText}>
              Quotes where you appear as the quoted person will be kept for your friends, with your display name preserved.
            </ThemedText>
          </View>

          {/* Confirmation input */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>
              Type <ThemedText style={styles.confirmWord}>{CONFIRMATION_WORD}</ThemedText> to continue
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { color: theme.inputText, borderColor: isConfirmed ? theme.destructive : theme.border },
              ]}
              value={inputValue}
              onChangeText={setInputValue}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={CONFIRMATION_WORD}
              placeholderTextColor={theme.secondaryText}
              editable={!isDeleting}
            />
            {countdown !== null && (
              <ThemedText style={[styles.countdownText, countdown === 0 && styles.countdownReady]}>
                {countdown > 0
                  ? `You can delete your account in ${countdown}s`
                  : 'Ready — tap below to delete your account'}
              </ThemedText>
            )}
          </View>

          {/* Delete button */}
          <Pressable
            style={[styles.deleteButton, (!isReady || isDeleting) && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={!isReady || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.deleteButtonText}>Delete my account</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    infoCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: theme.divider,
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.secondaryText,
      lineHeight: 20,
    },
    divider: {
      height: 1,
      backgroundColor: theme.divider,
      marginVertical: 12,
    },
    section: {
      marginBottom: 28,
    },
    sectionLabel: {
      fontSize: 14,
      color: theme.secondaryText,
      marginBottom: 10,
    },
    confirmWord: {
      fontWeight: '700',
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      backgroundColor: theme.cardBackground,
    },
    countdownText: {
      fontSize: 13,
      color: theme.secondaryText,
      marginTop: 10,
    },
    countdownReady: {
      color: theme.destructive,
    },
    deleteButton: {
      backgroundColor: theme.destructive,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonDisabled: {
      opacity: 0.35,
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
