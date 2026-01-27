import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { sendPasswordReset } from "@/lib/api/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from "react-native";

// Extract error message from various API error formats
function getApiErrorMessage(err: any): string {
  const data = err.response?.data;

  if (!data) {
    return err.message || "Something went wrong.";
  }

  // Check for non_field_errors array (Django DRF format)
  if (data.non_field_errors?.length > 0) {
    return data.non_field_errors[0];
  }

  // Check for detail string
  if (data.detail) {
    return data.detail;
  }

  // Check for field-specific errors
  if (data.email?.length > 0) {
    return Array.isArray(data.email) ? data.email[0] : data.email;
  }

  // Fallback
  return err.message || "Something went wrong.";
}

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const styles = useThemedStyles(getStyles);

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);

      // Navigate to confirmation screen with email param
      router.push(`/(auth)/reset-password-confirm?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      Alert.alert("Error", getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <IconSymbol name="chevron.left" size={24} color={styles.backButtonText.color} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 100}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="title" style={styles.title}>
              Forgot Password
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Enter your email and we&apos;ll send you a reset code
            </ThemedText>

            {/* Email input */}
            <TextInput
              key="forgot-password-email-input"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Send reset button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendReset}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Sending..." : "Send Reset Code"}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 60 : 20,
      paddingBottom: 10,
    },
    backButtonText: {
      color: theme.text,
      fontSize: 16,
      marginLeft: 4,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
      alignSelf: "flex-start",
    },
    subtitle: {
      color: theme.text,
      fontSize: 14,
      marginBottom: 20,
      opacity: 0.7,
    },
    input: {
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
    },
    button: {
      backgroundColor: theme.pastels.purple,
      paddingVertical: 14,
      borderRadius: 8,
      marginTop: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: theme.buttonText,
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 16,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });
