// app/(app)/(modals)/quote-actions.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useQuoteActionsModal } from "@/context/QuoteActionsModalContext";
import { useQuotes } from "@/context/QuotesContext";
import { useUser } from "@/context/UserContext";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function QuoteActionsModal() {
  const { selectedQuoteId, closeModal } = useQuoteActionsModal();
  const { quotes, saveQuoteById, unsaveQuoteById, hideQuoteById } = useQuotes();
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get the latest quote from the feed using the ID
  const selectedQuote = useMemo(() => {
    if (!selectedQuoteId) return null;
    return quotes.find((q) => q.id === selectedQuoteId);
  }, [selectedQuoteId, quotes]);

  const quoteData = useMemo(() => {
    if (!selectedQuote) return null;

    const isGuessable =
      !selectedQuote.has_guessed &&
      (selectedQuote.guess_options?.length ?? 0) > 1 &&
      selectedQuote.author.id !== user?.id;

    const isSavedQuote = selectedQuote.is_saved ?? false;
    const showAuthor = !!selectedQuote.author && !isGuessable;
    const showQuotedUser = !!selectedQuote.quoted_user && !isGuessable;

    return { quote: selectedQuote, isSavedQuote, showAuthor, showQuotedUser };
  }, [selectedQuote, user?.id]);

  // If no quote is selected, don't render anything
  if (!selectedQuote || !quoteData) return null;

  const { quote, isSavedQuote, showAuthor, showQuotedUser } = quoteData;

  const goToProfile = (userId: number) => {
    if (!userId) return;
    closeModal();
    router.push({ pathname: "/user/[userID]", params: { userID: String(userId) } });
  };

  const handleCopy = async () => {
    if (quote.text) {
      await Clipboard.setStringAsync(quote.text);
      Toast.show({ type: "success", text1: "Copied. Try not to misuse this power." });
    }
    closeModal();
  };

  const handleSave = async () => {
    if (!quote.id) return closeModal();

    try {
      if (isSavedQuote) {
        await unsaveQuoteById(quote.id);
        Toast.show({ type: "info", text1: "Unsaved. Bye bye." });
        await new Promise((r) => setTimeout(r, 100));
      } else {
        await saveQuoteById(quote.id);
        Toast.show({ type: "info", text1: "Saved. For future contemplation." });
      }
    } catch {
      Toast.show({ type: "error", text1: "Failed to update saved status." });
    }
    closeModal();
  };

  const handleHide = async () => {
    if (quote.id) {
      await hideQuoteById(quote.id);
      Toast.show({ type: "info", text1: "Hidden. Tap to undo." });
    }
    closeModal();
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Sheet */}
      <View style={styles.bottom} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 24 }]}>
          <View style={styles.group}>
            <ActionRow
              icon={isSavedQuote ? "bookmark.fill" : "bookmark"}
              label={isSavedQuote ? "Unsave" : "Save"}
              onPress={handleSave}
            />
            <Divider />
            <ActionRow icon="doc.on.doc" label="Copy text" onPress={handleCopy} />
          </View>

          <View style={styles.group}>
            <ActionRow
              icon="eye.slash"
              label="Hide this quote"
              onPress={handleHide}
              destructive
            />
          </View>

          {(showAuthor || showQuotedUser) && (
            <View style={styles.group}>
              {showAuthor && (
                <>
                  <ActionRow
                    label={`View ${quote.author.username} (poster)`}
                    onPress={() => goToProfile(quote.author.id)}
                  />
                  {showQuotedUser && <Divider />}
                </>
              )}

              {showQuotedUser && quote.quoted_user && (
                <ActionRow
                  label={`View ${quote.quoted_user.username} (speaker)`}
                  onPress={() => goToProfile(quote.quoted_user.id)}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon?: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {icon ? (
        <IconSymbol
          name={icon as any}
          size={16}
          color={destructive ? styles.destructive.color : styles.rowText.color}
          style={{ marginRight: 10 }}
        />
      ) : (
        <View style={{ width: 16, marginRight: 10 }} />
      )}
      <Text style={[styles.rowText, destructive && styles.destructive]}>{label}</Text>
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bottom: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  group: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  rowText: {
    fontSize: 16,
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 12,
  },
  destructive: {
    color: "#ff4d4d",
  },
});
