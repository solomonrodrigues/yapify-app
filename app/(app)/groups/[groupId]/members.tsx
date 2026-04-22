import { InitialsAvatar } from '@/components/InitialsAvatar';
import { SearchBar } from '@/components/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useGroups } from '@/context/GroupsContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getGroup, getGroupMembers, kickMember, inviteToGroup, Group, GroupMember } from '@/lib/api/groups';
import { searchUsers } from '@/lib/api/users';
import { getErrorMessage } from '@/lib/utils/error';
import { PublicUserSummary } from '@/types/api';
import { LegendList } from '@legendapp/list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = Number(groupId);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const styles = useThemedStyles(getStyles);
  const router = useRouter();
  const { refreshGroups } = useGroups();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Invite mode
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<PublicUserSummary[]>([]);
  const [inviteSearching, setInviteSearching] = useState(false);
  const [invitingId, setInvitingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupData, membersData] = await Promise.all([
        getGroup(id),
        getGroupMembers(id),
      ]);
      setGroup(groupData);
      setMembers(membersData.results);
      setNextUrl(membersData.next);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load members', text2: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await getGroupMembers(id, nextUrl);
      setMembers((prev) => [...prev, ...data.results]);
      setNextUrl(data.next);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleKick = (member: GroupMember) => {
    Alert.alert(
      `Remove ${member.user.display_name}?`,
      'They will no longer have access to this group\'s quotes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await kickMember(id, member.user.id);
              setMembers((prev) => prev.filter((m) => m.user.id !== member.user.id));
              refreshGroups();
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Failed to remove member', text2: getErrorMessage(err) });
            }
          },
        },
      ]
    );
  };

  const handleInviteSearch = useCallback(async (text: string) => {
    setInviteQuery(text);
    if (text.length < 2) {
      setInviteResults([]);
      return;
    }
    setInviteSearching(true);
    try {
      const data = await searchUsers(text);
      // Filter out existing members
      const memberIds = new Set(members.map((m) => m.user.id));
      setInviteResults(data.results.filter((u) => !memberIds.has(u.id)));
    } catch {
      setInviteResults([]);
    } finally {
      setInviteSearching(false);
    }
  }, [members]);

  const handleInvite = async (user: PublicUserSummary) => {
    setInvitingId(user.id);
    try {
      await inviteToGroup(id, user.id);
      Toast.show({ type: 'success', text1: `Invited ${user.display_name}` });
      setInviteQuery('');
      setInviteResults([]);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to send invite', text2: getErrorMessage(err) });
    } finally {
      setInvitingId(null);
    }
  };

  const isAdmin = group?.is_admin ?? false;

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
        {/* Invite search */}
        <View style={styles.inviteSection}>
          <SearchBar
            value={inviteQuery}
            onChangeText={handleInviteSearch}
            placeholder="Invite someone by username…"
          />
          {inviteSearching && <ActivityIndicator size="small" style={{ marginTop: 8 }} />}
          {inviteResults.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.inviteResult}
              onPress={() => handleInvite(user)}
              disabled={invitingId === user.id}
            >
              <InitialsAvatar user={user} size={36} />
              <View style={styles.userInfo}>
                <ThemedText style={styles.displayName}>{user.display_name}</ThemedText>
                <ThemedText style={styles.username}>@{user.username}</ThemedText>
              </View>
              {invitingId === user.id ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={[styles.inviteButton, { color: theme.accent }]}>Invite</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>MEMBERS ({members.length})</ThemedText>
        </View>

        <LegendList
          data={members}
          keyExtractor={(item) => item.user.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <InitialsAvatar user={item.user} size={40} />
              <View style={styles.userInfo}>
                <ThemedText style={styles.displayName}>{item.user.display_name}</ThemedText>
                <ThemedText style={styles.username}>@{item.user.username}</ThemedText>
              </View>
              {isAdmin && group?.created_by?.id !== item.user.id && (
                <TouchableOpacity
                  onPress={() => handleKick(item)}
                  hitSlop={8}
                  style={styles.kickButton}
                >
                  <Text style={styles.kickText}>Remove</Text>
                </TouchableOpacity>
              )}
              {group?.created_by?.id === item.user.id && (
                <Text style={[styles.adminBadge, { color: theme.secondaryText }]}>Admin</Text>
              )}
            </View>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" style={{ paddingVertical: 12 }} /> : null}
          ListEmptyComponent={
            <View style={styles.center}>
              <ThemedText style={{ color: theme.secondaryText }}>No members yet</ThemedText>
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    inviteSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    inviteResult: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10, paddingHorizontal: 4,
    },
    sectionHeader: {
      paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider,
    },
    sectionTitle: { fontSize: 12, fontWeight: '600', color: theme.secondaryText, letterSpacing: 1 },
    memberRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider,
    },
    userInfo: { flex: 1, marginLeft: 12 },
    displayName: { fontSize: 15, fontWeight: '500' },
    username: { fontSize: 13, color: theme.secondaryText },
    kickButton: { paddingHorizontal: 8, paddingVertical: 4 },
    kickText: { fontSize: 13, fontWeight: '500', color: '#FF3B30' },
    adminBadge: { fontSize: 12, fontWeight: '500' },
    inviteButton: { fontSize: 14, fontWeight: '600' },
    listContent: { paddingBottom: 32 },
  });
