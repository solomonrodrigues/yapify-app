import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { register } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/utils/error";
import LoginErrorHandler from "@/lib/utils/LoginErrorHandler";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from "react-native-reanimated";

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

  // Entrance animations
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(20);

  useEffect(() => {
    const timingConfig = { duration: 400, easing: Easing.out(Easing.ease) };
    logoOpacity.value = withTiming(1, timingConfig);
    logoTranslateY.value = withTiming(0, timingConfig);
    titleOpacity.value = withDelay(120, withTiming(1, timingConfig));
    titleTranslateY.value = withDelay(120, withTiming(0, timingConfig));
    formOpacity.value = withDelay(240, withTiming(1, timingConfig));
    formTranslateY.value = withDelay(240, withTiming(0, timingConfig));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

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
    } catch (err) {
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
        `/(auth)/email-verification?email=${encodeURIComponent(email)}`
      );
    } catch (err) {
      Alert.alert("Signup Failed", getErrorMessage(err) || "Something went wrong.");
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
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
              />
            </Animated.View>

            <Animated.View style={titleStyle}>
              <ThemedText type={"title"} style={styles.title}>
                {isLogin ? "Login" : "Create an Account"}
              </ThemedText>
            </Animated.View>

            <Animated.View style={formStyle}>
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
            </Animated.View>
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
    logoContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    logo: {
      width: 100,
      height: 100,
      borderRadius: 24,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontFamily: "Lora",
      fontWeight: "normal",
      marginBottom: 24,
      textAlign: "center",
      alignSelf: "flex-start",
    },
    input: {
      color: theme.text,
      backgroundColor: theme.inputBackground,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      fontSize: 16,
    },
    passwordInput: {
      color: theme.text,
      backgroundColor: theme.inputBackground,
      borderRadius: 14,
      padding: 14,
      paddingRight: 44,
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
      paddingVertical: 16,
      borderRadius: 14,
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
