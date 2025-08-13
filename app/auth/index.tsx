import { register } from "@/api/auth";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { Stack, useRouter } from "expo-router";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  async function handleLogin() {
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Failed", err.response?.data?.detail || err.message);
    }
  }

  async function handleRegister() {
    try {
      await register({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: passwordConfirm,
      });
      Alert.alert("Success", "Account created! Please log in.");
      setIsLogin(true);
    } catch (err: any) {
      Alert.alert("Signup Failed", err.response?.data?.detail || err.message);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
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
              <Text style={styles.title}>{isLogin ? "Login" : "Create an Account"}</Text>

              {!isLogin && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="#999"
                    value={firstName}
                    onChangeText={setFirstName} />
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor="#999"
                    value={lastName}
                    onChangeText={setLastName} />
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
      </ThemedView></>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center", // center by default
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#ccc",
    alignSelf: "flex-start",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#ccc",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    paddingRight: 40, // extra space for icon
    marginBottom: 12,
    fontSize: 16,
    color: "#ccc",
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
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  toggleText: {
    textAlign: "center",
    color: Colors.dark.primary,
    marginTop: 16,
  },
});
