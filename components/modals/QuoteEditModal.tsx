import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useToast } from "@/context/ToastContext";

const QUOTE_MAX_LENGTH = 280;
const CONTEXT_MAX_LENGTH = 150;

interface QuoteEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: { text: string; context: string | null }) => Promise<void>;
  initialText: string;
  initialContext: string | null;
}

const QuoteEditModal: React.FC<QuoteEditModalProps> = ({
  visible,
  onClose,
  onSave,
  initialText,
  initialContext,
}) => {
  const [quoteText, setQuoteText] = useState(initialText);
  const [contextText, setContextText] = useState(initialContext ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const styles = useThemedStyles(getStyles);

  const charCountColor =
    quoteText.length > QUOTE_MAX_LENGTH
      ? "#FF3B30"
      : quoteText.length > QUOTE_MAX_LENGTH * 0.85
        ? "#FF9500"
        : colorScheme === "dark"
          ? "#666"
          : "#999";

  // Reset to initial values when modal opens
  useEffect(() => {
    if (visible) {
      setQuoteText(initialText);
      setContextText(initialContext ?? "");
    }
  }, [visible, initialText, initialContext]);

  const hasChanges =
    quoteText.trim() !== initialText ||
    (contextText.trim() || null) !== (initialContext || null);

  const canSave =
    hasChanges &&
    quoteText.trim().length > 0 &&
    quoteText.length <= QUOTE_MAX_LENGTH &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      await onSave({
        text: quoteText.trim(),
        context: contextText.trim() || null,
      });
      toast.show({ variant: 'success', label: 'Quote updated' });
      onClose();
    } catch {
      toast.show({ variant: 'danger', label: 'Failed to update quote' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <IconSymbol
              name="xmark"
              size={20}
              color={colorScheme === "dark" ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: colorScheme === "dark" ? "#fff" : "#000" },
            ]}
          >
            Edit <Text style={styles.headerAccent}>Quote</Text>
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={!canSave}
          >
            <Text
              style={[
                styles.saveButtonText,
                !canSave && styles.saveButtonDisabled,
              ]}
            >
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
        >
          {/* Quote Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.quoteTextInput,
                {
                  color: colorScheme === "dark" ? "white" : "black",
                  borderBottomColor: colorScheme === "dark" ? "#333" : "#ccc",
                },
              ]}
              placeholder="What did they say?"
              placeholderTextColor="#999"
              value={quoteText}
              onChangeText={setQuoteText}
              multiline
              autoFocus
            />
          </View>

          {/* Character Count */}
          <View style={styles.charCountContainer}>
            <Text style={[styles.charCountText, { color: charCountColor }]}>
              {quoteText.length}/{QUOTE_MAX_LENGTH}
            </Text>
          </View>

          {/* Context Input */}
          <View style={styles.contextContainer}>
            <Text
              style={[
                styles.contextLabel,
                { color: colorScheme === "dark" ? "#666" : "#999" },
              ]}
            >
              context{" "}
              <Text style={styles.optionalHint}>(optional)</Text>
            </Text>
            <TextInput
              style={[
                styles.contextInput,
                {
                  color: colorScheme === "dark" ? "white" : "black",
                  borderBottomColor: contextText.trim()
                    ? theme.accent
                    : colorScheme === "dark"
                      ? "#222"
                      : "#ddd",
                },
              ]}
              placeholder="What led to this quote?"
              placeholderTextColor={colorScheme === "dark" ? "#444" : "#bbb"}
              value={contextText}
              onChangeText={setContextText}
              maxLength={CONTEXT_MAX_LENGTH}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.modalBackground,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.xxxl,
      paddingBottom: Spacing.sm,
    },
    headerButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "600",
    },
    headerAccent: {
      color: theme.accent,
    },
    saveButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.accent,
    },
    saveButtonDisabled: {
      opacity: 0.35,
    },
    content: {
      flexGrow: 1,
    },
    inputSection: {
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      marginTop: Spacing.lg,
    },
    quoteTextInput: {
      fontSize: 24,
      fontWeight: "300",
      paddingVertical: 10,
      paddingHorizontal: 0,
      minHeight: 60,
      textAlignVertical: "top",
      borderBottomWidth: 2,
      borderBottomColor: theme.accent,
    },
    charCountContainer: {
      alignItems: "flex-end",
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    charCountText: {
      fontSize: 13,
      fontWeight: "500",
    },
    contextContainer: {
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.lg,
    },
    contextLabel: {
      fontSize: 14,
      fontWeight: "300",
      marginBottom: Spacing.xs,
    },
    optionalHint: {
      fontSize: 12,
      fontWeight: "300",
      opacity: 0.5,
    },
    contextInput: {
      fontSize: 16,
      fontWeight: "300",
      paddingVertical: Spacing.sm,
      paddingHorizontal: 0,
      borderBottomWidth: 1,
    },
  });

export default QuoteEditModal;
