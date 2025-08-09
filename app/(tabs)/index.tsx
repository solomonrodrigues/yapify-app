import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;
const blockSize = screenWidth / 2 - 16; // Two columns with margin

// TypeScript types for API response (matches your Django model)
interface UserSummary {
  id: number;
  username: string;
}

interface Quote {
  id: number;
  text: string;
  author: UserSummary;
  quoted_user: UserSummary;
  context?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_public: boolean;
}

// Dummy data for preview
const dummyQuotes: Quote[] = [
  {
    id: 1,
    text: "Life is what happens when you're busy making other plans.",
    author: { id: 1, username: "alice" },
    quoted_user: { id: 2, username: "bob" },
    context: "At the cafe last weekend",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    is_public: true,
  },
  {
    id: 2,
    text: "I'm not lazy, I'm just on energy-saving mode.",
    author: { id: 2, username: "bob" },
    quoted_user: { id: 3, username: "charlie" },
    context: "During coding session",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    is_public: false,
  },
  {
    id: 3,
    text: "Do or do not. There is no try.",
    author: { id: 3, username: "charlie" },
    quoted_user: { id: 4, username: "dana" },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    is_public: true,
  },
];

export default function HomeScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    // For now, load dummy data
    setQuotes(dummyQuotes);

    // Later: replace with API call
    /*
    fetch('https://your-api.com/api/quotes/')
      .then(res => res.json())
      .then((data: Quote[]) => setQuotes(data))
      .catch(err => console.error(err));
    */
  }, []);

  const renderQuote = ({ item }: { item: Quote }) => (
    <View style={styles.quoteBlock}>
      <ThemedText type="subtitle" numberOfLines={4} style={styles.quoteText}>
        "{item.text}"
      </ThemedText>
      <Text style={styles.metaText}>— {item.quoted_user.username}</Text>
      <Text style={styles.metaText}>Posted by {item.author.username}</Text>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderQuote}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        />
        </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  quoteBlock: {
    width: blockSize,
    height: blockSize,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#000000',
  },
  metaText: {
    fontSize: 12,
    color: '#000000',
  },
});
