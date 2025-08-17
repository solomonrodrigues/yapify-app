import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getProfile } from '@/api/profile';
import { searchUsers, sendFriendRequest, getFriends } from '@/api/friends';
import { getQuotes, createQuote } from '@/api/quotes';
import { User, Quote } from '@/types/api';

export default function ApiTestScreen() {
  // App state
  const [profile, setProfile] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteText, setQuoteText] = useState('');

  const { logout } = useAuth();

  // Fetch profile, friends, and quotes on mount
  useEffect(() => {
    (async () => {
      try {
        const [profileData, friendsData, quotesData] = await Promise.all([
          getProfile(),
          getFriends(),
          getQuotes(),
        ]);
        setProfile(profileData);
        setFriends(friendsData);
        setQuotes(quotesData);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
    })();
  }, []);

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
      if (!profile) return;
      await createQuote({ text: quoteText });
      Alert.alert('Quote created');
      setQuoteText('');
      const freshQuotes = await getQuotes();
      setQuotes(freshQuotes);
    } catch (e: any) {
      Alert.alert('Create quote error', e.message);
    }
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Profile</Text>
      <Text>{profile.username} {profile.display_name} ({profile.email})</Text>

      <Text style={styles.header}>Friends</Text>
      <TextInput
        style={styles.input}
        placeholder="Search users"
        onChangeText={setSearchTerm}
        value={searchTerm}
        autoCapitalize="none"
      />
      <Button title="Search" onPress={handleSearchUsers} />
      {searchResults.map((user) => (
        <View key={user.id} style={styles.friendItem}>
          <Text>{user.username} {user.display_name}</Text>
          <Button title="Add Friend" onPress={() => handleSendFriendRequest(user.id)} />
        </View>
      ))}

      <Text style={styles.header}>My Friends</Text>
      {friends.map((f) => (
        <Text key={f.id}>{f.username} {f.display_name}</Text>
      ))}

      <Text style={styles.header}>Quotes</Text>
      <TextInput
        style={styles.input}
        placeholder="Write a quote"
        value={quoteText}
        onChangeText={setQuoteText}
      />
      <Button title="Create Quote" onPress={handleCreateQuote} />
      {quotes.map((q) => (
        <View key={q.id} style={styles.quoteItem}>
          <Text>"{q.text}" — {q.author_name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
