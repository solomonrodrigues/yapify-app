import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { searchUsers } from "@/lib/api/friends";
import { listRecentUsers, postRecentUserClick } from "@/lib/api/recents";
import { MinimalUser, User } from "@/types/api";
import { LegendList } from "@legendapp/list";
import { useRouter } from "expo-router";
import { debounce } from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [recent, setRecent] = useState<MinimalUser[]>([]);
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme();
  const styles = useThemedStyles(getStyles);
  const router = useRouter();

  const fetchSearchResults = async (text: string) => {
    try {
      setLoading(true);
      const data = await searchUsers(text);
      setResults(data);
    } catch (error) {
      console.error("Error fetching results:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useRef(
    debounce((text: string) => {
      if (text.length >= 2) fetchSearchResults(text);
      else setResults([]);
    }, 300)
  ).current;

  const handleSearch = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const handlePressUser = async (item: User) => {
    // Fire-and-forget server record of this recent click
    postRecentUserClick({ id: item.id }, query).catch((e) =>
      console.warn("postRecentUserClick failed", e)
    );

    router.push({
      pathname: "/user/[userID]",
      params: { userID: item.id },
    });
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.activityCard} onPress={() => handlePressUser(item)}>
      <InitialsAvatar user={item} size={30} />
      <View style={styles.activityText}>
        <ThemedText style={styles.displayName}>{item.display_name}</ThemedText>
        <ThemedText style={styles.username}>{item.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  // Load “Recent” when there isn’t an active query
  useEffect(() => {
    let cancelled = false;

    const loadRecents = async () => {
      try {
        const data = await listRecentUsers(10);
        if (!cancelled) setRecent(data as MinimalUser[]);
      } catch (e) {
        console.warn("Failed to load recent users", e);
      }
    };

    if (query.length < 2) {
      loadRecents();
    } else if (!cancelled) {
      setRecent([]); // hide recents when user is actively searching
    }
    return () => {
      cancelled = true;
    };
  }, [query]);

  const showRecent = useMemo(() => {
    if (query.length >= 2) return false;
    if (loading) return false;
    if (results.length > 0) return false;
    return recent.length > 0;
  }, [query, loading, results.length, recent.length]);

  return (
    <ThemedView>
      <SafeAreaView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.searchBox}>
            <IconSymbol
              size={20}
              name="magnifyingglass"
              color={styles.icon.color}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Search for friends..."
              placeholderTextColor={colorScheme === "dark" ? "#888" : "#999"}
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Results or Recent */}
        {loading ? (
          <ThemedText style={styles.message}>Searching...</ThemedText>
        ) : showRecent ? (
          <>
            <ThemedText style={[styles.message, { textAlign: "left", marginLeft: 16 }]}>
              Recent
            </ThemedText>
            <LegendList
              data={recent as User[]}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
            />
          </>
        ) : (
          <LegendList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              query.length >= 2 ? (
                <ThemedText style={styles.message}>No users found</ThemedText>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
};

export default Search;

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    inputContainer: {
      margin: 16,
      marginBottom: 12,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: theme.inputBackground,
      shadowColor: theme.inputShadowColor
    },
    icon: {
      marginRight: 10,
      color: theme.icon,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.inputText,
    },
    activityCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#414040ff",
    },
    activityText: {
      marginLeft: 12,
    },
    displayName: {
      fontSize: 16,
      fontWeight: "500",
    },
    username: {
      fontSize: 12,
      color: "#666",
    },
    message: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 14,
      color: "#999",
    },
  });
