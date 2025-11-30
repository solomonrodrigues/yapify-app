import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { sendPasswordReset } from "@/lib/api/auth";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
    View
} from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const styles = useThemedStyles(getStyles);

  // Cooldown timer for resend functionality
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);

      Alert.alert(
        "Reset Link Sent",
        "Check your email for the password reset link.",
        [{ text: "OK", onPress: () => router.replace("/auth") }]
      );

      setResendCooldown(5); // 5 second cooldown
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
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
            {/* Header with icon */}
            <View style={styles.headerContainer}>
              <View style={styles.iconCircle}>
                <IconSymbol name="lock.open" size={32} color="white" />
              </View>
              
              <ThemedText type="title" style={styles.title}>
                Forgot Password
              </ThemedText>
              
              <ThemedText style={styles.subtitle}>
                Enter your email and we&apos;ll send you a reset link
              </ThemedText>
            </View>

            {/* Email input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Email</ThemedText>
              <TextInput
                key="forgot-password-email-input"
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={styles.textInput.color + "40"}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Send reset button */}
            <TouchableOpacity
              style={[styles.sendButton, loading && styles.buttonDisabled]}
              onPress={handleSendReset}
              disabled={loading || resendCooldown > 0}
            >
              <Text style={styles.sendButtonText}>
                {loading
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Wait (${resendCooldown}s)`
                  : "Send Reset Link"}
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
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.pastels.purple,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: theme.pastels.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
    },
    subtitle: {
      color: theme.text,
      fontSize: 16,
      textAlign: "center",
      opacity: 0.8,
    },
    inputContainer: {
      marginBottom: 40,
    },
    inputLabel: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 10,
      textAlign: "center",
    },
    textInput: {
      height: 55,
      borderWidth: 2,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.background,
      shadowColor: theme.pastels.purple,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      paddingHorizontal: 20,
    },
    sendButton: {
      backgroundColor: theme.pastels.purple,
      paddingVertical: 16,
      borderRadius: 12,
      shadowColor: theme.pastels.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      marginBottom: 30,
    },
    sendButtonText: {
      color: "white",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 16,
    },
    buttonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0.1,
      elevation: 1,
    },
  });
