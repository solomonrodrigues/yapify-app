import { InitialsAvatar } from "@/components/InitialsAvatar";
import { SearchBar } from "@/components/SearchBar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getGroupMembers, GroupMember } from "@/lib/api/groups";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AssignUserModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (user: { id: number; username: string; display_name: string; profile_color: string }) => void;
  currentQuotedName?: string | null;
  groupId?: number | null;
}

const AssignUserModal: React.FC<AssignUserModalProps> = ({
  visible,
  onClose,
  onAssign,
  currentQuotedName,
  groupId,
}) => {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [searchResults, setSearchResults] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const styles = useThemedStyles(getStyles);

  useEffect(() => {
    if (visible && groupId) {
      loadMembers();
    }
  }, [visible, groupId]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSearchResults([]);
    }
  }, [visible]);

  const loadMembers = async () => {
    if (!groupId) return;
    setMembersLoading(true);
    try {
      const data = await getGroupMembers(groupId);
      setMembers(data.results);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSearchChange = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    if (!groupId) return;

    setSearchLoading(true);
    try {
      const data = await getGroupMembers(groupId, null, text);
      setSearchResults(data.results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [groupId]);

  const handleUserSelect = (member: GroupMember) => {
    Haptics.selectionAsync();
    onAssign(member.user);
  };

  const displayList = query.length >= 2 ? searchResults : members;
  const isLoading = query.length >= 2 ? searchLoading : membersLoading;
  const isEmpty = !isLoading && displayList.length === 0 && (query.length === 0 || query.length >= 2);

  const renderMemberItem = (item: GroupMember) => (
    <TouchableOpacity
      key={item.user.id}
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <InitialsAvatar user={item.user} size={40} />
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>{item.user.display_name}</ThemedText>
        <ThemedText style={styles.username}>@{item.user.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalContainer}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.modalSafeArea}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerCenter}>
              <View style={styles.grabber} />
              <ThemedText style={styles.headerTitle}>Assign to group member</ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <View style={styles.closeButtonCircle}>
                <IconSymbol name="xmark" size={12} color={theme.secondaryText} />
              </View>
            </TouchableOpacity>
          </View>

          {currentQuotedName && (
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitleText}>
                Replace &ldquo;{currentQuotedName}&rdquo; with a group member
              </Text>
            </View>
          )}

          {!groupId ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>This quote is not linked to a group</ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.searchContainer}>
                <SearchBar
                  value={query}
                  onChangeText={handleSearchChange}
                  placeholder="Search members"
                />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.usersList}
                keyboardShouldPersistTaps="handled"
              >
                {isLoading ? (
                  <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" />
                  </View>
                ) : isEmpty ? (
                  <View style={styles.emptyContainer}>
                    <IconSymbol name="person.2" size={40} color={theme.border} />
                    <ThemedText style={styles.emptyText}>
                      {query.length >= 2 ? "No members found" : "No group members yet"}
                    </ThemedText>
                  </View>
                ) : (
                  displayList.map((item) => renderMemberItem(item))
                )}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    modalContainer: { flex: 1 },
    modalSafeArea: { flex: 1 },
    modalHeader: {
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 14,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.divider,
    },
    headerCenter: { alignItems: "center" },
    grabber: {
      width: 36, height: 5, borderRadius: 3,
      backgroundColor: theme.border, marginBottom: 12,
    },
    headerTitle: { fontSize: 17, fontWeight: "600", color: theme.text },
    closeButton: { position: "absolute", right: 16, top: 28 },
    closeButtonCircle: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: theme.inputBackground,
      alignItems: "center", justifyContent: "center",
    },
    subtitleRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
    subtitleText: { fontSize: 13, color: theme.secondaryText, fontStyle: "italic" },
    searchContainer: { marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
    usersList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 6 },
    userItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4 },
    userInfo: { marginLeft: 12, flex: 1 },
    displayName: { fontSize: 16, fontWeight: "500" },
    username: { fontSize: 14, opacity: 0.7 },
    emptyContainer: { paddingVertical: 64, paddingHorizontal: 32, alignItems: "center", gap: 12 },
    emptyText: { fontSize: 15, color: theme.secondaryText, textAlign: "center", lineHeight: 22 },
  });

export default AssignUserModal;
