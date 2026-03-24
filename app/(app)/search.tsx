import { InitialsAvatar } from "@/components/InitialsAvatar";
import { SearchBar } from "@/components/SearchBar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useFriends } from "@/context/FriendsContext";
import { searchUsers } from "@/lib/api/friends";
import { searchQuotes } from "@/lib/api/quotes";
import { getErrorMessage } from "@/lib/utils/error";
import { Quote, MinimalUser, PublicUserList } from "@/types/api";
import { LegendList } from "@legendapp/list";
import { useRouter } from "expo-router";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { timeAgo } from "@/lib/utils/timeAgo";
import { FilterPicker } from "@/components/FilterPicker";
import { MONTH_KEYS, MONTH_MAP, MONTH_MAP_REVERSE } from "@/constants/Months";
import { useUser } from "@/context/UserContext";

type SearchScope = "users" | "quotes";

const SearchScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const styles = useThemedStyles(getStyles);
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useUser();
  const { recentUsers, upsertRecentUser, removeRecentUser } = useFriends();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("users");
  const [userResults, setUserResults] = useState<PublicUserList[]>([]);
  const [quoteResults, setQuoteResults] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);

  // Pagination state
  const [quoteNextPage, setQuoteNextPage] = useState<string | null>(null);
  const [userNextPage, setUserNextPage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal states
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);


  const debouncedSearch = useRef(
    debounce(async (text: string, scope: SearchScope, year?: number | null, month?: number | null) => {
      if (text.length === 0) {
        setUserResults([]);
        setQuoteResults([]);
        setQuoteNextPage(null);
        setUserNextPage(null);
        setSearchError(null);
        return;
      }

      setLoading(true);
      setSearchError(null);
      try {
        if (scope === "users") {
          const response = await searchUsers(text);
          setUserResults(response.results);
          setUserNextPage(response.next ?? null);
        } else {
          const response = await searchQuotes(text, year ?? undefined, month ?? undefined);
          setQuoteResults(response.results);
          setQuoteNextPage(response.next ?? null);
        }
      } catch (err) {
        setSearchError(getErrorMessage(err));
        setUserResults([]);
        setQuoteResults([]);
        setQuoteNextPage(null);
        setUserNextPage(null);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  const loadMore = useCallback(async () => {
    const nextPage = scope === "quotes" ? quoteNextPage : userNextPage;
    if (!nextPage || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      if (scope === "quotes") {
        const response = await searchQuotes(query, yearFilter ?? undefined, monthFilter ?? undefined, nextPage);
        setQuoteResults((prev) => [...prev, ...response.results]);
        setQuoteNextPage(response.next ?? null);
      } else {
        const response = await searchUsers(query, nextPage);
        setUserResults((prev) => [...prev, ...response.results]);
        setUserNextPage(response.next ?? null);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load more results', text2: getErrorMessage(err) });
    } finally {
      setIsLoadingMore(false);
    }
  }, [scope, quoteNextPage, userNextPage, isLoadingMore, query, yearFilter, monthFilter]);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    debouncedSearch(query, scope, yearFilter, monthFilter);
  }, [query, scope, yearFilter, monthFilter, debouncedSearch]);

  const handlePressUser = (user: PublicUserList | MinimalUser) => {
    upsertRecentUser(
      { id: user.id, username: user.username, display_name: user.display_name, profile_color: user.profile_color } as MinimalUser,
      query || undefined,
    );
    router.push({ pathname: "/user/[userID]", params: { userID: user.id } });
  };

  const handlePressQuote = (quote: Quote) => {
    router.push({ pathname: "/[quoteID]", params: { quoteID: quote.id } });
  };

  const handleRemoveRecent = (user: MinimalUser) => {
    removeRecentUser(user);
  };

  const highlightText = (text: string, term: string) => {
    if (!term) return text;

    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return parts.map((part, idx) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <ThemedText key={idx} style={{ backgroundColor: theme.pastels.blue }}>
          {part}
        </ThemedText>
      ) : (
        <ThemedText key={idx}>{part}</ThemedText>
      )
    );
  };

  /** Dedicated components for list items */
  const UserItem = ({ user }: { user: PublicUserList | MinimalUser }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handlePressUser(user)}>
      <InitialsAvatar user={user} size={32} />
      <View style={{ marginLeft: 8 }}>
        <ThemedText style={styles.displayName}>{user.display_name}</ThemedText>
        <ThemedText style={styles.username}>@{user.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const QuoteItem = ({ quote }: { quote: Quote }) => {
    // Check if the quote is guessable and not yet guessed
    const isGuessable =
      !quote.has_guessed &&
      (quote.guess_options?.length ?? 0) > 1 &&
      quote.author.id !== currentUser?.id;

    return (
      <TouchableOpacity style={styles.quoteCard} onPress={() => handlePressQuote(quote)}>
        <View style={styles.quoteHeader}>
          <InitialsAvatar user={isGuessable ? { display_name: '?', profile_color: 'GREY' } : quote.author} size={32} />
          <View style={{ marginLeft: 8 }}>
            <ThemedText style={styles.displayName}>
              {isGuessable ? "??? quoted ???" : `${quote.author.display_name} quoted ${quote.quoted_user?.display_name ?? quote.quoted_name ?? 'someone'}`}
            </ThemedText>
            <ThemedText style={styles.quoteDate}>{timeAgo(quote.created_at)}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.quoteText}>{highlightText(quote.text, query)}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.searchBarContainer}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search Yapify"
              autoFocus
            />
          </View>
        </View>

        {/* Scope & Filters */}
        <View style={styles.filterRow}>
          {(["users", "quotes"] as SearchScope[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, scope === key && styles.filterChipActive]}
              onPress={() => setScope(key)}
            >
              <ThemedText style={[styles.filterText, scope === key && styles.filterTextActive]}>
                {key === "users" ? "People" : "Quotes"}
              </ThemedText>
            </TouchableOpacity>
          ))}

          {scope === "quotes" && (
            <>
              <TouchableOpacity
                style={[styles.filterChip, yearFilter ? styles.filterChipActive : null]}
                onPress={() => setShowYearPicker(true)}
              >
                <IconSymbol
                  name="line.3.horizontal.decrease"
                  size={11}
                  color={yearFilter ? "#fff" : theme.secondaryText}
                  style={{ marginRight: 4 }}
                />
                <ThemedText style={[styles.filterText, yearFilter ? styles.filterTextActive : null]}>
                  {yearFilter ?? "Year"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, monthFilter ? styles.filterChipActive : null]}
                onPress={() => setShowMonthPicker(true)}
              >
                <IconSymbol
                  name="line.3.horizontal.decrease"
                  size={11}
                  color={monthFilter ? "#fff" : theme.secondaryText}
                  style={{ marginRight: 4 }}
                />
                <ThemedText style={[styles.filterText, monthFilter ? styles.filterTextActive : null]}>
                  {monthFilter ? MONTH_MAP_REVERSE[monthFilter] : "Month"}
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Results */}
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : query.length === 0 && recentUsers.length > 0 ? (
          <LegendList<MinimalUser>
            data={recentUsers}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.userCard} onPress={() => handlePressUser(item)}>
                <InitialsAvatar user={item} size={32} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <ThemedText style={styles.displayName}>{item.display_name}</ThemedText>
                  <ThemedText style={styles.username}>@{item.username}</ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveRecent(item)}
                  hitSlop={8}
                >
                  <IconSymbol name="xmark" size={14} color={theme.secondaryText} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListHeaderComponent={() => (
              <ThemedText style={styles.sectionHeader}>Recent</ThemedText>
            )}
          />
        ) : (
          <LegendList<PublicUserList | Quote>
            data={scope === "users" ? userResults : quoteResults}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (scope === "users" ? <UserItem user={item as PublicUserList} /> : <QuoteItem quote={item as Quote} />)}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator size="small" style={{ paddingVertical: 16 }} />
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  {query.length === 0
                    ? "Start typing to search."
                    : searchError
                    ? "Search failed. Check your connection."
                    : "No results found."}
                </ThemedText>
                {query.length > 0 && !searchError && (
                  <TouchableOpacity
                    style={styles.switchScopeButton}
                    onPress={() => setScope(scope === "users" ? "quotes" : "users")}
                  >
                    <ThemedText style={styles.switchScopeText}>
                      {scope === "users" ? "Search quotes instead?" : "Search people instead?"}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </View>

      <FilterPicker
        visible={showYearPicker}
        onClose={() => setShowYearPicker(false)}
        options={Array.from({ length: new Date().getFullYear() - 2025 + 1 }, (_, i) => new Date().getFullYear() - i)}
        selected={yearFilter}
        onSelect={(val) => setYearFilter(val as number | null)}
        theme={theme}
      />

      <FilterPicker
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        options={MONTH_KEYS}
        selected={
          monthFilter != null 
            ? MONTH_MAP_REVERSE[monthFilter]
            : null
        }
        onSelect={(val) => {        
          if (typeof val === "string") {
            // Convert short month string -> number (1–12)
            const monthIndex = MONTH_MAP[val];
            setMonthFilter(monthIndex); // store 1–12
          } else {
            setMonthFilter(null);
          }
        }}
        theme={theme}
      />

    </ThemedView>
  );
};

export default SearchScreen;

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    headerRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
    backButton: { marginRight: 12 },
    searchBarContainer: { flex: 1 },
    filterRow: { flexDirection: "row", marginVertical: 12, flexWrap: "wrap", gap: 8 },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    filterText: { fontSize: 13, fontWeight: "500" },
    filterTextActive: { color: "#fff" },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
      marginBottom: 8,
    },
    displayName: { fontSize: 15, fontWeight: "600" },
    username: { fontSize: 13, color: theme.secondaryText },
    quoteCard: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
      marginBottom: 12,
    },
    quoteHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    quoteText: { fontSize: 15, lineHeight: 22 },
    quoteDate: { fontSize: 12, color: theme.secondaryText },
    removeButton: {
      padding: 8,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      color: theme.secondaryText,
      marginBottom: 8,
      marginTop: 4,
    },
    emptyContainer: {
      alignItems: "center",
      marginTop: 40,
      paddingHorizontal: 20,
    },
    emptyText: {
      textAlign: "center",
      color: theme.secondaryText,
    },
    switchScopeButton: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.divider,
    },
    switchScopeText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
    },
  });
