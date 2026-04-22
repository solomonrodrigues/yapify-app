import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { confirmPasswordReset, sendPasswordReset } from "@/lib/api/auth";
import { getErrorCode, getErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/context/ToastContext";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  View,
} from "react-native";

export default function ResetPasswordConfirmScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeError, setCodeError] = useState<string | null>(null);

  const styles = useThemedStyles(getStyles);

  // Cooldown timer for resend functionality
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(numericText);
    setCodeError(null);
  };

  const handleResetPassword = async () => {
    if (code.length !== 6) {
      Alert.alert(
        "Incomplete Code",
        "Please enter the complete 6-digit reset code."
      );
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing Password", "Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset({
        email: email as string,
        code,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });

      Alert.alert(
        "Password Reset!",
        "Your password has been reset successfully. You can now log in with your new password.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)"),
          },
        ]
      );
    } catch (err) {
      if (getErrorCode(err) === 'RESET_CODE_INVALID') {
        setCodeError('Invalid or expired code.');
      } else {
        Alert.alert("Reset Failed", getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || resendCooldown > 0) return;

    try {
      await sendPasswordReset(email);
      Alert.alert("Code Sent", "A new reset code has been sent to your email.");
      setResendCooldown(30);
      setCode(""); // Clear current code
    } catch (err) {
      toast.show({ variant: 'danger', label: 'Resend failed.', description: getErrorMessage(err) });
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
              Reset Password
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Enter the code sent to <Text style={styles.emailText}>{email}</Text>
            </ThemedText>

            {/* Code input */}
            <TextInput
              key="reset-password-code-input"
              style={[styles.codeInput, codeError ? styles.codeInputError : null]}
              value={code}
              onChangeText={handleCodeChange}
              placeholder="123456"
              placeholderTextColor="#999"
              textContentType="oneTimeCode"
              autoComplete={
                Platform.select({ android: "sms-otp", ios: "one-time-code" }) ??
                "one-time-code"
              }
              inputMode="numeric"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoCapitalize="none"
              autoCorrect={false}
              selectTextOnFocus
            />
            {codeError && <Text style={styles.fieldError}>{codeError}</Text>}

            {/* New password field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password"
                placeholderTextColor="#999"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.iconWrapper}
              >
                <IconSymbol
                  name={showNewPassword ? "eye.slash" : "eye"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm password field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.iconWrapper}
              >
                <IconSymbol
                  name={showConfirmPassword ? "eye.slash" : "eye"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            {/* Reset button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Resetting..." : "Reset Password"}
              </Text>
            </TouchableOpacity>

            {/* Help text with integrated resend */}
            <View style={styles.helpContainer}>
              <ThemedText style={styles.helpText}>
                Didn&apos;t receive the code?{" "}
                <Text
                  onPress={handleResendCode}
                  style={[
                    styles.resendText,
                    resendCooldown > 0 && styles.resendTextDisabled,
                  ]}
                >
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
                </Text>
              </ThemedText>
            </View>
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
    emailText: {
      color: theme.accent,
      fontWeight: "600",
    },
    codeInput: {
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 20,
      fontWeight: "600",
      letterSpacing: 8,
    },
    inputContainer: {
      position: "relative",
      justifyContent: "center",
    },
    passwordInput: {
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 12,
      paddingRight: 40,
      marginBottom: 12,
      fontSize: 16,
    },
    iconWrapper: {
      position: "absolute",
      right: 12,
      top: "38%",
      transform: [{ translateY: -10 }],
    },
    button: {
      backgroundColor: theme.accent,
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
    codeInputError: {
      borderColor: '#FF3B30',
    },
    fieldError: {
      color: '#FF3B30',
      fontSize: 13,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 6,
    },
    helpContainer: {
      marginTop: 20,
    },
    helpText: {
      color: theme.text,
      fontSize: 14,
      textAlign: "center",
      opacity: 0.7,
    },
    resendText: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "500",
    },
    resendTextDisabled: {
      color: theme.text,
      opacity: 0.5,
    },
  });
