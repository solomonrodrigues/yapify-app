import { verifyEmail, resendVerificationCode } from "@/api/auth";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputChangeEventData,
  TextInputKeyPressEventData,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

export default function EmailVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const styles = useThemedStyles(getStyles);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const setRef = (i: number) => (el: TextInput | null) => {
    inputRefs.current[i] = el; // return void
  };

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= 1) {
      const newCode = [...code];
      newCode[index] = numericText;
      setCode(newCode);

      // Auto-advance to next input
      if (numericText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace - move to previous input if current is empty
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    // Handle pasted verification codes
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < 6; i++) {
      newCode[i] = numericText[i] || "";
    }
    
    setCode(newCode);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerifyCode = async () => {
    const verificationCode = code.join("");
    
    if (verificationCode.length !== 6) {
      Alert.alert("Incomplete Code", "Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email address is missing. Please try signing up again.");
      return;
    }

    setLoading(true);
    
    try {
      await verifyEmail(
        email,
        verificationCode
      );
      
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

    setResendLoading(true);
    
    try {
      await resendVerificationCode(email);
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
      setResendCooldown(30); // 30 second cooldown
      setCode(["", "", "", "", "", ""]); // Clear current code
    } catch (err: any) {
      Alert.alert("Resend Failed", err.response?.data?.detail || err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToSignup = () => {
    router.replace("/auth");
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
                        
              <View style={styles.codeInputContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={setRef(index)}
                    style={[styles.codeInput, !!digit && styles.codeInputFilled]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) =>
                      handleKeyPress(e.nativeEvent.key, index)
                    }
                    // Paste & iOS OTP autofill: arrives as multi-char here
                    onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) => {
                      const t = e.nativeEvent.text ?? "";
                      if (t.length > 1) handlePaste(t);
                    }}
                    // OTP autofill hints
                    textContentType="oneTimeCode"           // iOS OTP suggestion
                    autoComplete={
                      Platform.select({ android: "sms-otp", ios: "one-time-code" }) ??
                      "one-time-code"
                    }
                    // Keyboard / input mode
                    inputMode="numeric"                      // RN ≥0.71
                    keyboardType="number-pad"                // fallback/extra hint
                    maxLength={1}
                    textAlign="center"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus
                  />
                ))}
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.verifyButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? "Verifying..." : "Verify Email"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (resendLoading || resendCooldown > 0) && styles.buttonDisabled
                ]}
                onPress={handleResendCode}
                disabled={resendLoading || resendCooldown > 0}
              >
                <Text style={styles.resendButtonText}>
                  {resendLoading 
                    ? "Sending..." 
                    : resendCooldown > 0 
                    ? `Resend Code (${resendCooldown}s)`
                    : "Resend Code"
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToSignup}
              >
                <Text style={styles.backButtonText}>
                  Back to Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Help text */}
            <View style={styles.helpContainer}>
              <ThemedText style={styles.helpText}>
                Didn&apos;t receive the code? Check your spam folder or try resending.
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
    codeInputContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 20,
    },
    codeInput: {
      width: 45,
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
    },
    codeInputFilled: {
      borderColor: theme.pastels.green,
      backgroundColor: theme.pastels.green + "15", // 15% opacity
      shadowColor: theme.pastels.green,
      shadowOpacity: 0.2,
    },
    buttonContainer: {
      gap: 16,
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
    },
    verifyButtonText: {
      color: "white",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 16,
    },
    resendButton: {
      backgroundColor: theme.pastels.blue,
      paddingVertical: 14,
      borderRadius: 12,
      shadowColor: theme.pastels.blue,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    resendButtonText: {
      color: "white",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 15,
    },
    backButton: {
      backgroundColor: theme.pastels.pink,
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: theme.pastels.pink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    backButtonText: {
      color: "white",
      textAlign: "center",
      fontWeight: "500",
      fontSize: 14,
    },
    buttonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0.1,
      elevation: 1,
    },
    helpContainer: {
      marginTop: 30,
      paddingHorizontal: 10,
    },
    helpText: {
      color: theme.text,
      fontSize: 14,
      textAlign: "center",
      opacity: 0.7,
      lineHeight: 20,
    },
  });
