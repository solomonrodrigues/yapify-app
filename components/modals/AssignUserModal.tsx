import { InitialsAvatar } from "@/components/InitialsAvatar";
import { SearchBar } from "@/components/SearchBar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getFriends, getRecentFriends, searchFriends } from "@/lib/api/friends";
import { User } from "@/types/api";
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
import Toast from "react-native-toast-message";

interface AssignUserModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (user: User) => void;
  currentQuotedName?: string | null;
}

const AssignUserModal: React.FC<AssignUserModalProps> = ({
  visible,
  onClose,
  onAssign,
  currentQuotedName,
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const styles = useThemedStyles(getStyles);

  useEffect(() => {
    if (visible) {
      loadFriends();
      loadRecent();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSearchResults([]);
    }
  }, [visible]);

  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      const friendsData = await getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error("Error loading friends:", error);
      Toast.show({ type: "error", text1: "Failed to load friends" });
    } finally {
      setFriendsLoading(false);
    }
  };

  const loadRecent = async () => {
    try {
      const recentData = await getRecentFriends();
      setRecentUsers(recentData);
    } catch (error) {
      console.error("Error loading recent friends:", error);
    }
  };

  const handleSearchChange = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const data = await searchFriends(text);
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching friends:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleUserSelect = (user: User) => {
    Haptics.selectionAsync();
    onAssign(user);
  };

  const allFriends = (() => {
    if (query.length > 0) return searchResults;
    // Merge recent + friends, deduplicating by id
    const seen = new Set<number>();
    const merged: { section: string; users: User[] }[] = [];
    if (recentUsers.length > 0) {
      merged.push({ section: "Recent", users: recentUsers });
      recentUsers.forEach((u) => seen.add(u.id));
    }
    const remaining = friends.filter((u) => !seen.has(u.id));
    if (remaining.length > 0) {
      merged.push({ section: "Friends", users: remaining });
    }
    return merged;
  })();

  const isLoading = query.length > 0 ? searchLoading : friendsLoading;
  const isSearching = query.length > 0;
  const isEmpty = isSearching
    ? query.length >= 2 && searchResults.length === 0 && !searchLoading
    : friends.length === 0 && recentUsers.length === 0 && !friendsLoading;

  const renderUserItem = (item: User) => (
    <TouchableOpacity
      key={item.id}
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <InitialsAvatar user={item} size={40} />
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>{item.display_name}</ThemedText>
        <ThemedText style={styles.username}>@{item.username}</ThemedText>
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
              <ThemedText style={styles.headerTitle}>Assign to friend</ThemedText>
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
                Replace &ldquo;{currentQuotedName}&rdquo; with a registered friend
              </Text>
            </View>
          )}

          {/* Search */}
          <View style={styles.searchContainer}>
            <SearchBar
              value={query}
              onChangeText={handleSearchChange}
              placeholder="Search friends"
            />
          </View>

          {/* Friend list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersList}
            keyboardShouldPersistTaps="handled"
          >
            {isLoading && (friends.length === 0 && searchResults.length === 0) ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" />
              </View>
            ) : isEmpty ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="person.2" size={40} color={theme.border} />
                <ThemedText style={styles.emptyText}>
                  {isSearching ? "No friends found" : "No friends yet"}
                </ThemedText>
              </View>
            ) : isSearching ? (
              // Flat search results
              searchResults.map((item) => renderUserItem(item))
            ) : (
              // Sectioned list (Recent + Friends)
              (allFriends as { section: string; users: User[] }[]).map((group) => (
                <View key={group.section} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {group.section.toUpperCase()}
                  </Text>
                  {group.users.map((item) => renderUserItem(item))}
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
    },
    modalSafeArea: {
      flex: 1,
    },
    modalHeader: {
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 14,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.divider,
    },
    headerCenter: {
      alignItems: "center",
    },
    grabber: {
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.border,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
    },
    closeButton: {
      position: "absolute",
      right: 16,
      top: 28,
    },
    closeButtonCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    subtitleRow: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    subtitleText: {
      fontSize: 13,
      color: theme.secondaryText,
      fontStyle: "italic",
    },
    searchContainer: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
    },
    usersList: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      gap: 6,
    },
    section: {
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.secondaryText,
      letterSpacing: 1,
      marginBottom: 6,
      marginLeft: 4,
    },
    userItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    userInfo: {
      marginLeft: 12,
      flex: 1,
    },
    displayName: {
      fontSize: 16,
      fontWeight: "500",
    },
    username: {
      fontSize: 14,
      opacity: 0.7,
    },
    emptyContainer: {
      paddingVertical: 64,
      paddingHorizontal: 32,
      alignItems: "center",
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
      color: theme.secondaryText,
      textAlign: "center",
      lineHeight: 22,
    },
  });

export default AssignUserModal;
