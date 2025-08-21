import { register } from "@/api/auth";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
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
  View
} from "react-native";

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

  const styles = useThemedStyles(getStyles);

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
    // Simple required field check
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }

    try {
      await login(email, password);
      router.replace("/(app)/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Failed", err.response?.data?.detail || err.message);
    }
  }

  async function handleRegister() {
    // Required field validation
    if (!username.trim() || !displayName.trim() || !email.trim() || !password.trim() || !passwordConfirm.trim()) {
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
      Alert.alert("Invalid Display Name", "Display name must be 50 characters or less.");
      return;
    }

    // Password match check
    if (password !== passwordConfirm) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      await register({
        email,
        username: username,
        display_name: displayName,
        password,
        password_confirm: passwordConfirm,
      });
      router.push(`/auth/email-verification?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      Alert.alert("Signup Failed", err.response?.data?.detail || err.message);
    }
  }

  return (
    <ThemedView style={styles.container}>
      {/* KeyboardAvoidingView moves content up on keyboard open */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 100} // workable values from testing on-device - tweak if needed
      >
        {/* TouchableWithoutFeedback dismisses keyboard when tapping outside */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* ScrollView allows scrolling if needed */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type={'title'} style={styles.title}>{isLogin ? "Login" : "Create an Account"}</ThemedText>

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
                  />
                </View>
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail} />

            {/* Confirm password field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconWrapper}>
                <IconSymbol
                  name={showPassword ? 'eye.slash' : 'eye'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

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
                />
                <TouchableOpacity onPress={() => setShowPasswordConfirm(!showPasswordConfirm)} style={styles.iconWrapper}>
                  <IconSymbol
                    name={showPasswordConfirm ? 'eye.slash' : 'eye'}
                    size={24}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={isLogin ? handleLogin : handleRegister}
            >
              <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleText}>
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
  }
);
