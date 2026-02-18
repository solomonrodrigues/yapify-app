// app/(app)/(modals)/quote-actions.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import AssignUserModal from "@/components/modals/AssignUserModal";
import { ShareableQuote } from "@/components/ShareableQuote";
import { useQuoteActionsModal } from "@/context/QuoteActionsModalContext";
import { useQuotes } from "@/context/QuotesContext";
import { useUser } from "@/context/UserContext";
import { reportQuote, unreportQuote } from "@/lib/api/quotes";
import { getErrorMessage } from "@/lib/utils/error";
import { ReportReasonEnum, User } from "@/types/api";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { Colors } from "@/constants/Colors";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isIOS = Platform.OS === 'ios';

export default function QuoteActionsModal() {
  const { selectedQuoteId, selectedQuote: contextQuote, closeModal } = useQuoteActionsModal();
  const { quotes, saveQuoteById, unsaveQuoteById, hideQuoteById, deleteQuoteById, assignUserToQuoteById } = useQuotes();
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shareRef = useRef<{ share: () => Promise<void> }>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
    const isAssignable = isOwnQuote && !!selectedQuote.quoted_name && !selectedQuote.quoted_user?.id;

    return {
      quote: selectedQuote,
      isSavedQuote,
      isGuessable,
      showAuthor,
      showQuotedUser,
      isOwnQuote,
      isQuotedUser,
      isAssignable,
    };
  }, [selectedQuote, user?.id]);

  // If no quote is selected, don't render anything
  if (!selectedQuote || !quoteData) return null;

  const { quote, isSavedQuote, isGuessable, showAuthor, showQuotedUser, isOwnQuote, isAssignable } = quoteData;

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

  const handleShare = async () => {
    try {
      await shareRef.current?.share();
    } catch (error) {
      console.error('Share failed:', error);
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

  const submitReport = async (reason: ReportReasonEnum) => {
    try {
      await reportQuote(quote.id, { reason });
      const reportedQuoteId = quote.id;
      Toast.show({
        type: "success",
        text1: "Quote reported",
        text2: "Tap to undo",
        onPress: async () => {
          Toast.hide();
          try {
            await unreportQuote(reportedQuoteId);
            Toast.show({ type: "info", text1: "Report withdrawn" });
          } catch (undoError) {
            Toast.show({ type: "error", text1: "Failed to undo report", text2: getErrorMessage(undoError) });
          }
        },
      });
    } catch (error: any) {
      const detail = getErrorMessage(error);
      console.error("Report quote failed:", error?.response?.status, detail);
      Toast.show({ type: "error", text1: "Failed to report quote", text2: detail });
    }
    closeModal();
  };

  const handleReport = () => {
    if (!quote.id) return;

    Alert.alert(
      "Report Quote",
      "Why are you reporting this quote?",
      [
        { text: "Inappropriate", onPress: () => submitReport("inappropriate") },
        { text: "Spam", onPress: () => submitReport("spam") },
        { text: "Harassment", onPress: () => submitReport("harassment") },
        { text: "False Attribution", onPress: () => submitReport("false_attribution") },
        { text: "Other", onPress: () => submitReport("other") },
        { text: "Cancel", style: "cancel" },
      ]
    );
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


  const handleAssign = async (selectedUser: User) => {
    setAssignModalVisible(false);
    try {
      await assignUserToQuoteById(quote.id, {
        id: selectedUser.id,
        username: selectedUser.username,
        display_name: selectedUser.display_name,
        profile_color: selectedUser.profile_color ?? "GREY",
      });
      Toast.show({ type: "success", text1: `Assigned to ${selectedUser.display_name}` });
      closeModal();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to assign user", text2: getErrorMessage(error) });
    }
  };

  const themedStyles = getThemedStyles(isDark, theme);

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Backdrop for Android */}
      {!isIOS && (
        <Pressable style={styles.backdrop} onPress={closeModal} />
      )}
      {/* Sheet */}
      <View style={styles.bottom} pointerEvents="box-none">
        <View style={[styles.sheet, !isIOS && themedStyles.sheetAndroid, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 24 }]}>
          <View style={themedStyles.group}>
            <ActionRow
              icon={isSavedQuote ? "bookmark.fill" : "bookmark"}
              label={isSavedQuote ? "Unsave" : "Save"}
              onPress={handleSave}
              isDark={isDark}
              theme={theme}
            />
            <Divider isDark={isDark} />
            <ActionRow icon="doc.on.doc" label="Copy text" onPress={handleCopy} isDark={isDark} theme={theme} />
            <Divider isDark={isDark} />
            <ActionRow icon="square.and.arrow.up" label="Share as image" onPress={handleShare} isDark={isDark} theme={theme} />
            {isOwnQuote && isAssignable && (
              <>
                <Divider isDark={isDark} />
                <ActionRow
                  icon="person.badge.plus"
                  label="Assign to friend"
                  subtitle={quote.quoted_name ?? undefined}
                  onPress={() => setAssignModalVisible(true)}
                  isDark={isDark}
                  theme={theme}
                />
              </>
            )}
          </View>

          <View style={themedStyles.group}>
            {!isOwnQuote && (
              <>
                <ActionRow
                  icon="eye.slash"
                  label="Hide this quote"
                  onPress={handleHide}
                  destructive
                  isDark={isDark}
                  theme={theme}
                />
                <Divider isDark={isDark} />
                <ActionRow
                  icon="exclamationmark.triangle"
                  label="Report quote"
                  onPress={handleReport}
                  destructive
                  isDark={isDark}
                  theme={theme}
                />
              </>
            )}
            {isOwnQuote && (
              <ActionRow
                icon="trash"
                label="Delete quote"
                onPress={handleDelete}
                destructive
                isDark={isDark}
                theme={theme}
              />
            )}
          </View>

          {(showAuthor || showQuotedUser) && (
            <View style={themedStyles.group}>
              {showAuthor && (
                <>
                  <ActionRow
                    icon="person.circle"
                    label={`@${quote.author.username}`}
                    subtitle="Posted this quote"
                    onPress={() => goToProfile(quote.author.id)}
                    isDark={isDark}
                    theme={theme}
                  />
                  {showQuotedUser && <Divider isDark={isDark} />}
                </>
              )}

              {showQuotedUser && quote.quoted_user && (
                <ActionRow
                  icon="quote.bubble"
                  label={`@${quote.quoted_user.username}`}
                  subtitle="Said this quote"
                  onPress={() => goToProfile(quote.quoted_user.id)}
                  isDark={isDark}
                  theme={theme}
                />
              )}
            </View>
          )}

        </View>
      </View>
      {/* Hidden component for share-as-image */}
      <ShareableQuote ref={shareRef} quote={quote} guessable={isGuessable} />
      {/* Assign user modal */}
      {isAssignable && (
        <AssignUserModal
          visible={assignModalVisible}
          onClose={() => setAssignModalVisible(false)}
          onAssign={handleAssign}
          currentQuotedName={quote.quoted_name}
        />
      )}
    </View>
  );
}

function ActionRow({
  icon,
  label,
  subtitle,
  onPress,
  destructive,
  isDark,
  theme,
}: {
  icon?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  isDark: boolean;
  theme: typeof Colors.light | typeof Colors.dark;
}) {
  const textColor = destructive ? theme.destructive : theme.text;
  const subtitleColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
  const pressedBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: pressedBg }]}>
      {icon && (
        <IconSymbol
          name={icon as any}
          size={20}
          color={textColor}
          style={{ marginRight: 12 }}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowText, { color: textColor }]}>{label}</Text>
        {subtitle && <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }]} />;
}

function getThemedStyles(isDark: boolean, theme: typeof Colors.light | typeof Colors.dark) {
  return {
    sheetAndroid: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    group: {
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      borderRadius: 14,
      overflow: "hidden" as const,
      marginBottom: 12,
    },
  };
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
  row: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    fontSize: 16,
    fontWeight: "500",
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 12,
  },
});
