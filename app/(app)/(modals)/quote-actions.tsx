// app/(app)/(modals)/quote-actions.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useBlockedUsers } from "@/context/BlockedUsersContext";
import { useQuoteActionsModal } from "@/context/QuoteActionsModalContext";
import { useQuotes } from "@/context/QuotesContext";
import { useUser } from "@/context/UserContext";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isIOS = Platform.OS === 'ios';

export default function QuoteActionsModal() {
  const { selectedQuoteId, selectedQuote: contextQuote, closeModal } = useQuoteActionsModal();
  const { quotes, saveQuoteById, unsaveQuoteById, hideQuoteById, deleteQuoteById, removeQuotesInvolvingUser } = useQuotes();
  const { user } = useUser();
  const { blockUserById } = useBlockedUsers();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get the quote from context first, or fall back to looking it up in the feed
  const selectedQuote = useMemo(() => {
    if (!selectedQuoteId) return null;
    // If we have the quote in context (from detail screen), use it
    if (contextQuote && contextQuote.id === selectedQuoteId) return contextQuote;
    // Otherwise, look it up in the feed (from feed screen)
    return quotes.find((q) => q.id === selectedQuoteId) || null;
  }, [selectedQuoteId, contextQuote, quotes]);

  const quoteData = useMemo(() => {
    if (!selectedQuote) return null;

    const isGuessable =
      !selectedQuote.has_guessed &&
      (selectedQuote.guess_options?.length ?? 0) > 1 &&
      selectedQuote.author.id !== user?.id;

    const isSavedQuote = selectedQuote.is_saved ?? false;
    const showAuthor = !!selectedQuote.author && !isGuessable;
    const showQuotedUser = !!selectedQuote.quoted_user && !isGuessable;
    const isOwnQuote = selectedQuote.author.id === user?.id;
    const isQuotedUser = selectedQuote.quoted_user?.id === user?.id;

    // Determine which user can be blocked (author if not own quote, or quoted_user if different from author)
    const canBlockAuthor = !isOwnQuote && selectedQuote.author.id !== user?.id;
    const canBlockQuotedUser = selectedQuote.quoted_user &&
      selectedQuote.quoted_user.id !== user?.id &&
      selectedQuote.quoted_user.id !== selectedQuote.author.id;

    return {
      quote: selectedQuote,
      isSavedQuote,
      showAuthor,
      showQuotedUser,
      isOwnQuote,
      isQuotedUser,
      canBlockAuthor,
      canBlockQuotedUser,
    };
  }, [selectedQuote, user?.id]);

  // If no quote is selected, don't render anything
  if (!selectedQuote || !quoteData) return null;

  const { quote, isSavedQuote, showAuthor, showQuotedUser, isOwnQuote, canBlockAuthor, canBlockQuotedUser } = quoteData;

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

  const handleDelete = () => {
    if (!quote.id) return;

    Alert.alert(
      "Delete Quote",
      "Are you sure you want to delete this quote? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteQuoteById(quote.id);
              Toast.show({ type: "success", text1: "Quote deleted" });
              closeModal();
              // Navigate back if on detail screen
              if (router.canGoBack()) {
                router.back();
              }
            } catch (error) {
              Toast.show({ type: "error", text1: "Failed to delete quote" });
            }
          },
        },
      ]
    );
  };

  const handleBlock = (userId: number, username: string) => {
    Alert.alert(
      "Block Account",
      `Are you sure you want to block @${username}? You won't see quotes from them anymore. You can unblock them later in Settings.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUserById(userId);
              removeQuotesInvolvingUser(userId);
              Toast.show({ type: "info", text1: `@${username} blocked` });
              closeModal();
              // Navigate back if on detail screen
              if (router.canGoBack()) {
                router.back();
              }
            } catch (error) {
              Toast.show({ type: "error", text1: "Failed to block user" });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Backdrop for Android */}
      {!isIOS && (
        <Pressable style={styles.backdrop} onPress={closeModal} />
      )}
      {/* Sheet */}
      <View style={styles.bottom} pointerEvents="box-none">
        <View style={[styles.sheet, !isIOS && styles.sheetAndroid, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 24 }]}>
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
            {isOwnQuote && (
              <>
                <Divider />
                <ActionRow
                  icon="trash"
                  label="Delete quote"
                  onPress={handleDelete}
                  destructive
                />
              </>
            )}
          </View>

          {(showAuthor || showQuotedUser) && (
            <View style={styles.group}>
              {showAuthor && (
                <>
                  <ActionRow
                    icon="person.circle"
                    label={`@${quote.author.username}`}
                    subtitle="Posted this quote"
                    onPress={() => goToProfile(quote.author.id)}
                  />
                  {showQuotedUser && <Divider />}
                </>
              )}

              {showQuotedUser && quote.quoted_user && (
                <ActionRow
                  icon="quote.bubble"
                  label={`@${quote.quoted_user.username}`}
                  subtitle="Said this quote"
                  onPress={() => goToProfile(quote.quoted_user.id)}
                />
              )}
            </View>
          )}

          {(canBlockAuthor || canBlockQuotedUser) && (
            <View style={styles.group}>
              {canBlockAuthor && (
                <>
                  <ActionRow
                    icon="nosign"
                    label={`Block @${quote.author.username}`}
                    onPress={() => handleBlock(quote.author.id, quote.author.username)}
                    destructive
                  />
                  {canBlockQuotedUser && <Divider />}
                </>
              )}
              {canBlockQuotedUser && quote.quoted_user && (
                <ActionRow
                  icon="nosign"
                  label={`Block @${quote.quoted_user.username}`}
                  onPress={() => handleBlock(quote.quoted_user.id, quote.quoted_user.username)}
                  destructive
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
  subtitle,
  onPress,
  destructive,
}: {
  icon?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {icon && (
        <IconSymbol
          name={icon as any}
          size={20}
          color={destructive ? styles.destructive.color : styles.rowText.color}
          style={{ marginRight: 12 }}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowText, destructive && styles.destructive]}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
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
  sheetAndroid: {
    backgroundColor: "#1c1c1e",
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
    fontWeight: "500",
  },
  rowSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
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
