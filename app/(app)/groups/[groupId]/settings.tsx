import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useGroups } from '@/context/GroupsContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getGroup, renameGroup, deleteGroup, leaveGroup, Group } from '@/lib/api/groups';
import { getErrorMessage } from '@/lib/utils/error';
import { useUser } from '@/context/UserContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function GroupSettingsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = Number(groupId);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const styles = useThemedStyles(getStyles);
  const router = useRouter();
  const { user } = useUser();
  const { refreshGroups, setCurrentGroup, currentGroup } = useGroups();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    getGroup(id)
      .then((g) => { setGroup(g); setNameInput(g.name); })
      .catch(() => Toast.show({ type: 'error', text1: 'Failed to load group' }))
      .finally(() => setLoading(false));
  }, [id]);

  const isAdmin = group?.is_admin ?? false;
  const isCreator = group?.created_by?.id === user?.id;

  const handleRename = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === group?.name) return;
    setRenaming(true);
    try {
      const updated = await renameGroup(id, trimmed);
      setGroup(updated);
      setNameInput(updated.name);
      if (currentGroup?.id === id) setCurrentGroup(updated);
      refreshGroups();
      Toast.show({ type: 'success', text1: 'Group renamed' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to rename group', text2: getErrorMessage(err) });
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      `Delete "${group?.name}"?`,
      'This will permanently delete the group and all its quote history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteGroup(id);
              if (currentGroup?.id === id) setCurrentGroup(null);
              refreshGroups();
              Toast.show({ type: 'info', text1: 'Group deleted' });
              router.back();
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Failed to delete group', text2: getErrorMessage(err) });
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      `Leave "${group?.name}"?`,
      "You'll lose access to this group's quotes.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveGroup(id);
              if (currentGroup?.id === id) setCurrentGroup(null);
              refreshGroups();
              Toast.show({ type: 'info', text1: `Left "${group?.name}"` });
              router.back();
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Failed to leave group', text2: getErrorMessage(err) });
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.content}>

          {/* Group name */}
          {isAdmin ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>GROUP NAME</ThemedText>
              <View style={styles.renameRow}>
                <TextInput
                  style={[styles.nameInput, { color: theme.text, borderBottomColor: nameInput.trim() !== group?.name ? theme.accent : theme.border }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  maxLength={100}
                  returnKeyType="done"
                  onSubmitEditing={handleRename}
                />
                {nameInput.trim() !== group?.name && (
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.accent }]}
                    onPress={handleRename}
                    disabled={renaming}
                  >
                    {renaming
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.saveButtonText}>Save</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>GROUP NAME</ThemedText>
              <ThemedText style={styles.nameDisplay}>{group?.name}</ThemedText>
            </View>
          )}

          {/* Members link */}
          <TouchableOpacity
            style={[styles.row, { borderColor: theme.border }]}
            onPress={() => router.push({ pathname: '/groups/[groupId]/members', params: { groupId: id.toString() } })}
          >
            <ThemedText style={styles.rowText}>Members</ThemedText>
            <ThemedText style={[styles.rowMeta, { color: theme.secondaryText }]}>
              {group?.member_count ?? 0} →
            </ThemedText>
          </TouchableOpacity>

          {/* Danger zone */}
          <View style={styles.dangerSection}>
            {isCreator ? (
              <TouchableOpacity
                style={[styles.dangerButton, { borderColor: '#FF3B30' }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator color="#FF3B30" />
                  : <Text style={styles.dangerText}>Delete Group</Text>
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.dangerButton, { borderColor: '#FF3B30' }]}
                onPress={handleLeave}
                disabled={leaving}
              >
                {leaving
                  ? <ActivityIndicator color="#FF3B30" />
                  : <Text style={styles.dangerText}>Leave Group</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: theme.secondaryText, letterSpacing: 1, marginBottom: 10 },
    renameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    nameInput: {
      flex: 1, fontSize: 20, fontWeight: '400',
      paddingVertical: 6, borderBottomWidth: 2,
    },
    nameDisplay: { fontSize: 20, fontWeight: '400', paddingVertical: 6 },
    saveButton: {
      paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: 8, alignItems: 'center',
    },
    saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, paddingHorizontal: 16,
      borderRadius: 10, borderWidth: 1, marginBottom: 12,
    },
    rowText: { fontSize: 16, fontWeight: '500' },
    rowMeta: { fontSize: 14 },
    dangerSection: { marginTop: 'auto', paddingBottom: 24 },
    dangerButton: {
      borderWidth: 1, borderRadius: 10,
      paddingVertical: 14, alignItems: 'center',
    },
    dangerText: { color: '#FF3B30', fontWeight: '600', fontSize: 16 },
  });
