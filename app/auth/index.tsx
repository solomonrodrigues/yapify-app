import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { register } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";

export default function AuthScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup-only fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  async function handleLogin() {
    try {
      await login(email, password);
      Alert.alert("Success", "Logged in successfully!");
      router.replace("/(tabs)"); // This navigates to app/(tabs)/index.tsx
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
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? "Login" : "Sign Up"}</Text>

      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
        />
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
            ? "Don't have an account? Sign Up"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#222",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#4F46E5",
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
    color: "#4F46E5",
    marginTop: 16,
  },
});
