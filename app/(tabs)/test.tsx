import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';

import { login, register } from '@/api/auth';
import { getProfile } from '@/api/profile';
import { searchUsers, sendFriendRequest, getFriends } from '@/api/friends';
import { getQuotes, createQuote } from '@/api/quotes';
import { User, Quote } from '@/types/api';

export default function ApiTestScreen() {
  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // App state
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteText, setQuoteText] = useState('');

  // Handlers
  const handleRegister = async () => {
    try {
      await register({
        email,
        password,
        password_confirm: password,
        first_name: firstName,
        last_name: lastName,
      });
      Alert.alert('Registered! Please log in now.');
    } catch (e: any) {
      Alert.alert('Register error', JSON.stringify(e.response?.data || e.message));
    }
  };

  const handleLogin = async () => {
    try {
      await login(email, password);
      setLoggedIn(true);
    } catch (e: any) {
      Alert.alert('Login error', JSON.stringify(e.response?.data || e.message));
    }
  };

  // Fetch profile after login
  useEffect(() => {
    if (loggedIn) {
      getProfile().then(setProfile).catch((e) => Alert.alert('Profile error', e.message));
      getFriends().then(setFriends).catch((e) => Alert.alert('Friends error', e.message));
      getQuotes().then(setQuotes).catch((e) => Alert.alert('Quotes error', e.message));
    }
  }, [loggedIn]);

  const handleSearchUsers = async () => {
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    } catch (e: any) {
      Alert.alert('Search error', e.message);
    }
  };

  const handleSendFriendRequest = async (id: number) => {
    try {
      await sendFriendRequest(id);
      Alert.alert('Friend request sent');
    } catch (e: any) {
      Alert.alert('Send friend request error', e.message);
    }
  };

  const handleCreateQuote = async () => {
    try {
      await createQuote({ text: quoteText, quoted_user: profile!, is_public: true, is_active: true });
      Alert.alert('Quote created');
      setQuoteText('');
      const freshQuotes = await getQuotes();
      setQuotes(freshQuotes);
    } catch (e: any) {
      Alert.alert('Create quote error', e.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Register</Text>
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} value={email} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
      <TextInput style={styles.input} placeholder="First Name" onChangeText={setFirstName} value={firstName} />
      <TextInput style={styles.input} placeholder="Last Name" onChangeText={setLastName} value={lastName} />
      <Button title="Register" onPress={handleRegister} />

      <Text style={styles.header}>Login</Text>
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} value={email} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
      <Button title="Login" onPress={handleLogin} />

      {loggedIn && profile && (
        <>
          <Text style={styles.header}>Profile</Text>
          <Text>{profile.first_name} {profile.last_name} ({profile.email})</Text>

          <Text style={styles.header}>Friends</Text>
          <TextInput style={styles.input} placeholder="Search users" onChangeText={setSearchTerm} value={searchTerm} />
          <Button title="Search" onPress={handleSearchUsers} />
          {searchResults.map((user: any) => (
            <View key={user.id} style={styles.friendItem}>
              <Text>{user.first_name} {user.last_name}</Text>
              <Button title="Add Friend" onPress={() => handleSendFriendRequest(user.id)} />
            </View>
          ))}

          <Text style={styles.header}>My Friends</Text>
          {friends.map((f: any) => (
            <Text key={f.id}>{f.first_name} {f.last_name}</Text>
          ))}

          <Text style={styles.header}>Quotes</Text>
          <TextInput
            style={styles.input}
            placeholder="Write a quote"
            value={quoteText}
            onChangeText={setQuoteText}
          />
          <Button title="Create Quote" onPress={handleCreateQuote} />
          {quotes.map((q: any) => (
            <View key={q.id} style={styles.quoteItem}>
              <Text>"{q.text}" — {q.author.first_name}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    fontSize: 18,
    marginVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  friendItem: {
    marginBottom: 8,
  },
  quoteItem: {
    marginBottom: 8,
  },
};
