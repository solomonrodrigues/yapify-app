import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { searchUsers } from "@/lib/api/friends";
import { listRecentUsers, postRecentUserClick } from "@/lib/api/recents";
import { getQuote } from "@/lib/api/quotes";
import { MinimalUser, User, Quote } from "@/types/api";
import { LegendList } from "@legendapp/list";
import { useRouter } from "expo-router";
import { debounce } from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SearchScope = "users" | "quotes";

const Search = () => {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("users");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [quoteResults, setQuoteResults] = useState<Quote[]>([]);
  const [recent, setRecent] = useState<MinimalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [featuredQuote, setFeaturedQuote] = useState<Quote | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const colorScheme = useColorScheme();
  const styles = useThemedStyles(getStyles);
  const theme = Colors[colorScheme ?? 'dark'];
  const router = useRouter();

  // Fetch featured "Stupidest quote of the week"
  useEffect(() => {
    const fetchFeaturedQuote = async () => {
      try {
        setFeaturedLoading(true);
        const randomId = 15;
        const quote = await getQuote(randomId);
        setFeaturedQuote(quote);
      } catch (error) {
        console.error("Error fetching featured quote:", error);
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchFeaturedQuote();
  }, []);

  const featuredOnThisDay = [
    {
      id: "otd-1",
      yearsAgo: 1,
      text: "You said: \"I'll start tomorrow.\"",
    },
    {
      id: "otd-2",
      yearsAgo: 2,
      text: "Someone replied: \"Bold of you to assume tomorrow exists.\"",
    },
  ];

  const featuredTopStreaks = [
    {
      id: "streak-1",
      user: { display_name: "Alice", username: "alice" },
      days: 42,
    },
    {
      id: "streak-2",
      user: { display_name: "Ben", username: "ben" },
      days: 17,
    },
  ];

  const fetchSearchResults = async (text: string, activeScope: SearchScope) => {
    try {
      setLoading(true);

      let users: User[] = [];
      let quotes: Quote[] = [];

      if (activeScope === "users") {
        users = await searchUsers(text);
      } else if (activeScope === "quotes") {
        // Fetch multiple quotes for demo
        const ids = Array.from({ length: 5 }, (_, i) => 15 + i);
        const quotePromises = ids.map(id =>
          getQuote(id).catch(() => null)
        );
        const results = await Promise.all(quotePromises);
        quotes = results.filter((q): q is Quote => q !== null);
      }

      setUserResults(users);
      setQuoteResults(quotes);
    } catch (error) {
      console.error("Error fetching results:", error);
      setUserResults([]);
      setQuoteResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useRef(
    debounce((text: string, activeScope: SearchScope) => {
      if (text.length >= 2) {
        fetchSearchResults(text, activeScope);
      } else {
        setUserResults([]);
        setQuoteResults([]);
      }
    }, 300)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = (text: string) => {
    setQuery(text);
    debouncedSearch(text, scope);
  };

  useEffect(() => {
    if (query.length >= 2) {
      debouncedSearch(query, scope);
    }
  }, [debouncedSearch, query, scope]);

  const handlePressUser = async (item: User) => {
    postRecentUserClick({ id: item.id }, query).catch((e) =>
      console.warn("postRecentUserClick failed", e)
    );

    router.push({
      pathname: "/user/[userID]",
      params: { userID: item.id },
    });
  };

  const handlePressQuote = (quote: Quote) => {
    router.push({
      pathname: "/[quoteID]",
      params: { quoteID: quote.id },
    });
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handlePressUser(item)}
      activeOpacity={0.6}
    >
      <InitialsAvatar user={item} size={32} />
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>{item.display_name}</ThemedText>
        <ThemedText style={styles.username}>@{item.username}</ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={16} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  const renderQuoteItem = ({ item }: { item: Quote }) => {
    return (
      <TouchableOpacity 
        style={styles.quoteCard}
        onPress={() => handlePressQuote(item)}
        activeOpacity={0.6}
      >
        <View style={styles.quoteHeader}>
          <InitialsAvatar user={item.author} size={32} />
          <View style={styles.quoteAuthorInfo}>
            <ThemedText style={styles.quoteAuthorName}>
              {item.author.display_name}
            </ThemedText>
            <ThemedText style={styles.quoteUsername}>
              @{item.author.username}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.quoteText} numberOfLines={3}>
          &quot;{item.text}&quot;
        </ThemedText>
        <View style={styles.quoteFooter}>
          <View style={styles.quoteStat}>
            <IconSymbol name="heart.fill" size={14} color={theme.likeButton} />
            <ThemedText style={styles.quoteStatText}>{item.like_count}</ThemedText>
          </View>
          <View style={styles.quoteStat}>
            <IconSymbol name="eye.fill" size={14} color={theme.witnessButton} />
            <ThemedText style={styles.quoteStatText}>{item.witness_count}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      setRecent([]);
    }
    return () => {
      cancelled = true;
    };
  }, [query]);

  const showFeatured = useMemo(
    () => query.length < 2 && !loading,
    [query, loading]
  );

  const hasUserResults = userResults.length > 0;
  const hasQuoteResults = quoteResults.length > 0;
  const nothingFound = query.length >= 2 && !loading && !hasUserResults && !hasQuoteResults;

  const handleClearQuery = () => {
    setQuery("");
    setUserResults([]);
    setQuoteResults([]);
  };

  return (
    <ThemedView>
      <SafeAreaView style={styles.container}>
        <View style={styles.inputContainer}>
          <View
            style={[
              styles.searchBox,
              isFocused && styles.searchBoxFocused,
            ]}
          >
            <IconSymbol
              size={18}
              name="magnifyingglass"
              color={styles.icon.color}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder={scope === "users" ? "Search users..." : "Search quotes..."}
              placeholderTextColor={colorScheme === "dark" ? "#777" : "#999"}
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClearQuery} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconSymbol
                  size={18}
                  name="xmark.circle.fill"
                  color={styles.clearIcon.color}
                  style={styles.clearIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            {(["users", "quotes"] as SearchScope[]).map((key) => {
              const isActive = scope === key;
              const label = key === "users" ? "Users" : "Quotes";

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setScope(key)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {showFeatured ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {recent.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>Recent</ThemedText>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentScrollContent}
                >
                  {recent.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.recentChip}
                      onPress={() => handlePressUser(user as unknown as User)}
                      activeOpacity={0.7}
                    >
                      <InitialsAvatar user={user as unknown as User} size={36} />
                      <ThemedText style={styles.recentName} numberOfLines={1}>
                        {user.display_name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText style={styles.sectionTitle}>
                  Quote of the week
                </ThemedText>
                <IconSymbol name="flame.fill" size={16} color="#F97316" />
              </View>
              {featuredLoading ? (
                <View style={styles.featuredQuoteCard}>
                  <ActivityIndicator size="small" color={theme.accent} />
                </View>
              ) : featuredQuote ? (
                <TouchableOpacity
                  style={styles.featuredQuoteCard}
                  onPress={() => handlePressQuote(featuredQuote)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.featuredQuoteText}>
                    &quot;{featuredQuote.text}&quot;
                  </ThemedText>
                  <View style={styles.featuredQuoteFooter}>
                    <View style={styles.featuredAuthorInfo}>
                      <InitialsAvatar user={featuredQuote.author} size={24} />
                      <ThemedText style={styles.featuredAuthorName}>
                        {featuredQuote.author.display_name}
                      </ThemedText>
                    </View>
                    <View style={styles.featuredStats}>
                      <View style={styles.featuredStat}>
                        <IconSymbol name="heart.fill" size={12} color={theme.likeButton} />
                        <ThemedText style={styles.featuredStatText}>
                          {featuredQuote.like_count}
                        </ThemedText>
                      </View>
                      <View style={styles.featuredStat}>
                        <IconSymbol name="eye.fill" size={12} color={theme.witnessButton} />
                        <ThemedText style={styles.featuredStatText}>
                          {featuredQuote.witness_count}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText style={styles.sectionTitle}>On this day</ThemedText>
                <IconSymbol name="clock.arrow.circlepath" size={16} color={theme.accent} />
              </View>
              {featuredOnThisDay.map((item) => (
                <View key={item.id} style={styles.memoryCard}>
                  <ThemedText style={styles.memoryYears}>
                    {item.yearsAgo} year{item.yearsAgo > 1 ? "s" : ""} ago
                  </ThemedText>
                  <ThemedText style={styles.memoryText}>{item.text}</ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText style={styles.sectionTitle}>Top streaks</ThemedText>
                <IconSymbol name="bolt.fill" size={16} color="#FACC15" />
              </View>
              {featuredTopStreaks.map((item) => (
                <View key={item.id} style={styles.streakCard}>
                  <View style={styles.streakLeft}>
                    <InitialsAvatar user={item.user as unknown as User} size={32} />
                    <View style={styles.streakInfo}>
                      <ThemedText style={styles.displayName}>
                        {item.user.display_name}
                      </ThemedText>
                      <ThemedText style={styles.username}>
                        @{item.user.username}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.streakBadge}>
                    <IconSymbol name="flame.fill" size={14} color="#FACC15" />
                    <ThemedText style={styles.streakCount}>{item.days}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent} />
              </View>
            )}

            {!loading && query.length >= 2 && (
              <View style={styles.resultsContainer}>
                {scope === "users" && (
                  <LegendList
                    data={userResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderUserItem}
                    ListEmptyComponent={
                      <ThemedText style={styles.emptyMessage}>
                        No users found
                      </ThemedText>
                    }
                  />
                )}

                {scope === "quotes" && (
                  <LegendList
                    data={quoteResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderQuoteItem}
                    ListEmptyComponent={
                      <ThemedText style={styles.emptyMessage}>
                        No quotes found
                      </ThemedText>
                    }
                  />
                )}
              </View>
            )}
          </>
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
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    inputContainer: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 8,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 24,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
      backgroundColor: theme.inputBackground,
      shadowColor: theme.inputShadowColor,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.04)",
    },
    searchBoxFocused: {
      borderColor: "#4F46E5",
      shadowOpacity: 0.16,
      elevation: 4,
    },
    icon: {
      marginRight: 10,
      color: theme.icon,
    },
    clearIcon: {
      marginLeft: 6,
      color: "#bbb",
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    filterRow: {
      flexDirection: "row",
      marginTop: 10,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.08)",
      marginRight: 8,
      backgroundColor: "transparent",
    },
    filterChipActive: {
      backgroundColor: "rgba(79,70,229,0.12)",
      borderColor: theme.pastels.purple,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: "500",
    },
    filterChipTextActive: {
      color: theme.pastels.purple,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 80,
    },
    section: {
      marginTop: 24,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    recentScrollContent: {
      gap: 12,
    },
    recentChip: {
      alignItems: "center",
      width: 72,
    },
    recentName: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
    },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    displayName: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
    },
    username: {
      fontSize: 14,
      color: theme.secondaryText,
    },
    quoteCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quoteHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    quoteAuthorInfo: {
      marginLeft: 10,
      flex: 1,
    },
    quoteAuthorName: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 2,
    },
    quoteUsername: {
      fontSize: 13,
      color: theme.secondaryText,
    },
    quoteText: {
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 12,
    },
    quoteFooter: {
      flexDirection: "row",
      gap: 16,
    },
    quoteStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    quoteStatText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    featuredQuoteCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    featuredQuoteText: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: "500",
      marginBottom: 16,
    },
    featuredQuoteFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    featuredAuthorInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    featuredAuthorName: {
      fontSize: 14,
      fontWeight: "600",
    },
    featuredStats: {
      flexDirection: "row",
      gap: 12,
    },
    featuredStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    featuredStatText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.secondaryText,
    },
    memoryCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    memoryYears: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.accent,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    memoryText: {
      fontSize: 14,
      lineHeight: 20,
    },
    streakCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    streakLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    streakInfo: {
      marginLeft: 12,
      flex: 1,
    },
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: 'rgba(250, 204, 21, 0.15)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    streakCount: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FACC15",
    },
    resultsContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 80,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 60,
    },
    emptyMessage: {
      textAlign: "center",
      marginTop: 40,
      fontSize: 15,
      color: theme.secondaryText,
    },
  });
