import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { register } from "@/lib/api/auth";
import LoginErrorHandler from "@/lib/utils/LoginErrorHandler";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export default function AuthScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup-only fields
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Submission/loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(getStyles);
  const colorScheme = useColorScheme() ?? 'dark';

  // Validation functions
  const validateUsername = (text: string): boolean => {
    const usernameRegex = /^[a-z._]+$/;
    return text.length <= 30 && usernameRegex.test(text);
  };

  const validateDisplayName = (text: string): boolean => {
    return text.length <= 50;
  };

  // Handle username input with validation
  const handleUsernameChange = (text: string) => {
    // Only allow valid characters as user types
    const filteredText = text.toLowerCase().replace(/[^a-z._]/g, '');
    
    if (filteredText.length <= 30) {
      setUsername(filteredText);
    }
  };

  // Handle display name input with validation
  const handleDisplayNameChange = (text: string) => {
    if (text.length <= 50) {
      setDisplayName(text);
    }
  };

  async function handleLogin() {
    if (isSubmitting) return;

    // Simple required field check
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both email and password."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      router.replace("/(app)/(tabs)");
    } catch (err: any) {
      const errorHandler = new LoginErrorHandler(router, email);
      errorHandler.handle(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister() {
    if (isSubmitting) return;

    // Required field validation
    if (
      !username.trim() ||
      !displayName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !passwordConfirm.trim()
    ) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }

    // Username validation
    if (!validateUsername(username)) {
      Alert.alert(
        "Invalid Username",
        "Username must be 30 characters or less and can only contain lowercase letters, underscores, and periods."
      );
      return;
    }

    // Display name validation
    if (!validateDisplayName(displayName)) {
      Alert.alert(
        "Invalid Display Name",
        "Display name must be 50 characters or less."
      );
      return;
    }

    // Password match check
    if (password !== passwordConfirm) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        email,
        username: username,
        display_name: displayName,
        password,
        password_confirm: passwordConfirm,
      });
      router.push(
        `/auth/email-verification?email=${encodeURIComponent(email)}`
      );
    } catch (err: any) {
      Alert.alert(
        "Signup Failed",
        err.response?.data?.detail || err.message || "Something went wrong."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      {/* KeyboardAvoidingView moves content up on keyboard open */}
      <KeyboardAvoidingView behavior={"padding"} style={{ flex: 1 }}>
        {/* TouchableWithoutFeedback dismisses keyboard when tapping outside */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* ScrollView allows scrolling if needed */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type={"title"} style={styles.title}>
              {isLogin ? "Login" : "Create an Account"}
            </ThemedText>

            {!isLogin && (
              <>
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={handleUsernameChange}
                    maxLength={30}
                    autoCapitalize="none"
                    editable={!isSubmitting}
                  />
                </View>

                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Display Name"
                    placeholderTextColor="#999"
                    value={displayName}
                    onChangeText={handleDisplayNameChange}
                    maxLength={50}
                    editable={!isSubmitting}
                  />
                </View>
              </>
            )}

            <TextInput
              key={`login-email-${colorScheme}`}
              style={[styles.input, { letterSpacing: 0 }]}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isSubmitting}
            />

            {/* Password field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconWrapper}
                disabled={isSubmitting}
              >
                <IconSymbol
                  name={showPassword ? "eye.slash" : "eye"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password link - only in login mode */}
            {isLogin && (
              <TouchableOpacity
                onPress={() => router.push("/(auth)/reset-password")}
                disabled={isSubmitting}
                style={styles.forgotPasswordContainer}
              >
                <Text
                  style={[
                    styles.forgotPasswordText,
                    isSubmitting && styles.toggleTextDisabled,
                  ]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Confirm password field */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPasswordConfirm}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswordConfirm(!showPasswordConfirm)
                  }
                  style={styles.iconWrapper}
                  disabled={isSubmitting}
                >
                  <IconSymbol
                    name={showPasswordConfirm ? "eye.slash" : "eye"}
                    size={24}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={isLogin ? handleLogin : handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? "Login" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.toggleText,
                  isSubmitting && styles.toggleTextDisabled,
                ]}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Login"}
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
      justifyContent: "center", // center by default
      padding: 20,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      alignSelf: "flex-start",
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
    passwordInput: {
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 8,
      padding: 12,
      paddingRight: 40, // extra space for icon
      marginBottom: 12,
      fontSize: 16,
    },
    inputContainer: {
      position: "relative",
      justifyContent: "center",
    },
    iconWrapper: {
      position: "absolute",
      right: 12,
      top: "38%",
      transform: [{ translateY: -10 }],
    },
    button: {
      backgroundColor: theme.pastels.purple,
      paddingVertical: 14,
      borderRadius: 8,
      marginTop: 4,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: theme.buttonText,
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 16,
    },
    toggleText: {
      textAlign: "center",
      color: theme.pastels.purple,
      marginTop: 16,
    },
    toggleTextDisabled: {
      opacity: 0.6,
    },
    forgotPasswordContainer: {
      alignSelf: "flex-end",
      marginBottom: 12,
      marginTop: -4,
    },
    forgotPasswordText: {
      color: theme.text,
      fontSize: 14,
      opacity: 0.6,
    },
  });
