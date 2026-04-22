import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useGroups } from '@/context/GroupsContext';
import { createGroup } from '@/lib/api/groups';
import { getErrorMessage } from '@/lib/utils/error';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/context/ToastContext';

export default function CreateGroupScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const { toast } = useToast();
  const { refreshGroups, setCurrentGroup } = useGroups();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const group = await createGroup(trimmed);
      await refreshGroups();
      setCurrentGroup(group);
      toast.show({ variant: 'success', label: `"${group.name}" created` });
      router.back();
    } catch (err) {
      toast.show({ variant: 'danger', label: 'Failed to create group', description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText style={styles.label}>Group name</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderBottomColor: name.trim() ? theme.accent : theme.border }]}
            placeholder="e.g. The Boys, Work Friends…"
            placeholderTextColor={theme.secondaryText}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <Text style={[styles.hint, { color: theme.secondaryText }]}>
            You can invite friends after creating the group.
          </Text>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: name.trim() ? theme.accent : theme.buttonDisabled }]}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={[styles.createButtonText, { color: theme.buttonText }]}>Create Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, opacity: 0.5 },
  input: {
    fontSize: 24,
    fontWeight: '300',
    paddingVertical: 8,
    borderBottomWidth: 2,
    marginBottom: 12,
  },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 32 },
  createButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: { fontSize: 16, fontWeight: '600' },
});
