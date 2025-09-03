import { searchUsers } from "@/api/friends";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { User } from "@/types/api";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { debounce } from "lodash";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "@/components/ThemedView";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
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

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() =>
        router.push({
          pathname: "/user/[userID]",
          params: { userID: item.id },
        })
      }
    >
      <InitialsAvatar user={item} size={30} />
      <View style={styles.activityText}>
        <ThemedText style={styles.displayName}>{item.display_name}</ThemedText>
        <ThemedText style={styles.username}>{item.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

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
          />
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <ThemedText style={styles.message}>Searching...</ThemedText>
      ) : (
        <FlatList
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
