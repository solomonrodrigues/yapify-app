import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { resendVerificationCode, verifyEmail } from "@/lib/api/auth";
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
    View
} from "react-native";

export default function EmailVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [code, setCode] = useState("");
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

  const handleCodeChange = (text: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(numericText);
  };

  const handleVerifyCode = async () => {    
    if (code.length !== 6) {
      Alert.alert("Incomplete Code", "Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email address is missing. Please try signing up again.");
      return;
    }

    setLoading(true);
    
    try {
      await verifyEmail(email, code);
      
      Alert.alert(
        "Email Verified!", 
        "Your email has been verified successfully. You can now log in.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth")
          }
        ]
      );
    } catch (err: any) {
      Alert.alert("Verification Failed", err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || resendCooldown > 0) return;

    try {
      await resendVerificationCode(email);
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
      setResendCooldown(5); // 5 second cooldown to prevent spam
      setCode(""); // Clear current code
    } catch (err: any) {
      Alert.alert("Resend Failed", err.response?.data?.detail || err.message);
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
                <IconSymbol
                  name="envelope.badge"
                  size={32}
                  color="white"
                />
              </View>
              
              <ThemedText type="title" style={styles.title}>
                Verify Your Email
              </ThemedText>
              
              <ThemedText style={styles.subtitle}>
                We&apos;ve sent a 6-digit verification code to
              </ThemedText>
              
              <ThemedText style={styles.emailText}>
                {email}
              </ThemedText>
            </View>

            {/* Code input section */}
            <View style={styles.codeContainer}>
              <ThemedText style={styles.codeLabel}>
                Enter verification code
              </ThemedText>
                        
              <TextInput
                key="email-verification-code-input"
                style={styles.codeInput}
                value={code}
                onChangeText={handleCodeChange}
                placeholder="123456"
                placeholderTextColor={styles.codeInput.color + "40"}
                // OTP autofill hints
                textContentType="oneTimeCode"
                autoComplete={
                  Platform.select({ android: "sms-otp", ios: "one-time-code" }) ??
                  "one-time-code"
                }
                // Keyboard / input mode
                inputMode="numeric"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoCapitalize="none"
                autoCorrect={false}
                selectTextOnFocus
              />
            </View>

            {/* Single Verify button */}
            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              <Text style={styles.verifyButtonText}>
                {loading ? "Verifying..." : "Verify"}
              </Text>
            </TouchableOpacity>

            {/* Help text with integrated resend */}
            <View style={styles.helpContainer}>
              <ThemedText style={styles.helpText}>
                Didn&apos;t receive the code? Check your spam folder or{" "}
                <Text
                  onPress={handleResendCode}
                  style={[
                    styles.resendText,
                    resendCooldown > 0 && styles.resendTextDisabled
                  ]}
                >
                  {resendCooldown > 0 ? `resend (${resendCooldown}s)` : "resend"}
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
      marginBottom: 8,
      opacity: 0.8,
    },
    emailText: {
      color: theme.pastels.blue,
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    codeContainer: {
      marginBottom: 40,
    },
    codeLabel: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "500",
      textAlign: "center",
      marginBottom: 20,
    },
    codeInput: {
      height: 55,
      borderWidth: 2,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      fontSize: 24,
      fontWeight: "600",
      color: theme.text,
      backgroundColor: theme.background,
      shadowColor: theme.pastels.purple,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      paddingHorizontal: 20,
      letterSpacing: 8, // Space out the digits
    },
    verifyButton: {
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
    verifyButtonText: {
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
    helpContainer: {
      paddingHorizontal: 10,
    },
    helpText: {
      color: theme.text,
      fontSize: 14,
      textAlign: "center",
      opacity: 0.7,
      lineHeight: 20,
    },
    resendText: {
      color: theme.pastels.blue,
      fontSize: 14,
      fontWeight: "500",
      textDecorationLine: 'underline',
    },
    resendTextDisabled: {
      color: theme.text,
      opacity: 0.5,
      textDecorationLine: 'none',
    },
  });
