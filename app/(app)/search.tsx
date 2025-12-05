import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { searchUsers } from "@/lib/api/friends";
import { searchQuotes } from "@/lib/api/quotes";
import { User, Quote } from "@/types/api";
import { LegendList } from "@legendapp/list";
import { useRouter } from "expo-router";
import { debounce } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { timeAgo } from "@/lib/utils/timeAgo";
import { FilterPicker } from "@/components/FilterPicker";
import { MONTH_KEYS, MONTH_MAP, MONTH_MAP_REVERSE } from "@/constants/Months";

type SearchScope = "users" | "quotes";

const SearchScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const styles = useThemedStyles(getStyles);
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("quotes");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [quoteResults, setQuoteResults] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);

  // Modal states
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);


  const debouncedSearch = useRef(
    debounce(async (text: string, scope: SearchScope, year?: number | null, month?: number | null) => {
      if (text.length < 2) {
        setUserResults([]);
        setQuoteResults([]);
        return;
      }

      setLoading(true);
      try {
        if (scope === "users") {
          const users = await searchUsers(text);
          setUserResults(users);
        } else {
          const quotes = await searchQuotes(text, year ?? undefined, month ?? undefined);
          setQuoteResults(quotes);
        }
      } catch (err) {
        console.error("Search error", err);
        setUserResults([]);
        setQuoteResults([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    debouncedSearch(query, scope, yearFilter, monthFilter);
  }, [query, scope, yearFilter, monthFilter, debouncedSearch]);

  const handlePressUser = (user: User) => {
    router.push({ pathname: "/user/[userID]", params: { userID: user.id } });
  };

  const handlePressQuote = (quote: Quote) => {
    router.push({ pathname: "/[quoteID]", params: { quoteID: quote.id } });
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
  const UserItem = ({ user }: { user: User }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handlePressUser(user)}>
      <InitialsAvatar user={user} size={32} />
      <View style={{ marginLeft: 8 }}>
        <ThemedText style={styles.displayName}>{user.display_name}</ThemedText>
        <ThemedText style={styles.username}>@{user.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const QuoteItem = ({ quote }: { quote: Quote }) => (
    <TouchableOpacity style={styles.quoteCard} onPress={() => handlePressQuote(quote)}>
      <View style={styles.quoteHeader}>
        <InitialsAvatar user={quote.author} size={32} />
        <View style={{ marginLeft: 8 }}>
          <ThemedText style={styles.displayName}>{quote.author.display_name}</ThemedText>
          <ThemedText style={styles.username}>@{quote.author.username}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.quoteText}>{highlightText(quote.text, query)}</ThemedText>
      <ThemedText style={styles.quoteDate}>{timeAgo(quote.created_at)}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Search Yapify"
            placeholderTextColor={theme.secondaryText}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={{ marginLeft: 8 }}>
              <IconSymbol name="xmark.circle.fill" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          )}
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
                <ThemedText style={[styles.filterText, yearFilter ? styles.filterTextActive : null]}>
                  {yearFilter ?? "Year"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, monthFilter ? styles.filterChipActive : null]}
                onPress={() => setShowMonthPicker(true)}
              >
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
        ) : (
          <LegendList<User | Quote>
            data={scope === "users" ? userResults : quoteResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (scope === "users" ? <UserItem user={item as User} /> : <QuoteItem quote={item as Quote} />)}
            ListEmptyComponent={() => (
              <ThemedText style={{ textAlign: "center", marginTop: 40 }}>
                {query.length < 2 ? "Type at least 2 characters to search." : "No results found."}
              </ThemedText>
            )}
          />
        )}
      </View>

      <FilterPicker
        visible={showYearPicker}
        onClose={() => setShowYearPicker(false)}
        options={Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)}
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
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: theme.inputBackground,
      color: theme.text,
    },
    filterRow: { flexDirection: "row", marginVertical: 12, flexWrap: "wrap", gap: 8 },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: { backgroundColor: theme.pastels.purple, borderColor: theme.pastels.purple },
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
    quoteDate: { fontSize: 12, color: theme.secondaryText, marginTop: 6 },    
  });
