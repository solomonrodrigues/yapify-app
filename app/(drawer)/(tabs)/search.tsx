import { searchUsers } from "@/api/friends";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { User } from "@/types/api";
import { getInitials } from "@/utils/user";
import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    fetchSearchResults(text)
  };

  const fetchSearchResults= async (text: string): Promise<void> => {
    try {
      setLoading(true);

      const data = await searchUsers(text);
      setResults(data);
      console.log(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      Alert.alert(
        'Error',
        'Failed to load quotes. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // results card
  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.activityCard}>
      <InitialsAvatar initials={getInitials(item)} size={24}  />
      <View style={styles.activityText}>
        <ThemedText>{item.display_name}</ThemedText>
        <ThemedText style={{fontSize:12}}>{item.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  // search bar
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconWrapper} >
          <IconSymbol
            size={20} name="magnifyingglass" color={"#ccc"}
          />
        </TouchableOpacity>
        <TextInput
          style={[
           styles.input, // keep existing stylesheet ref
            {
              color: colorScheme === "dark" ? 'white' : 'black',
              paddingLeft: 40,    // shifts text & placeholder right
            },
          ]}
          placeholder="Search for friends..."
          placeholderTextColor="#999"   // makes placeholder white
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      
  
    
      {loading ? (
        <ThemedText style={{ textAlign: "center", marginTop: 20 }}>Searching...</ThemedText>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<ThemedText style={{ textAlign: "center", marginTop: 20 }}>No users found</ThemedText>}
        />
      )}
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    width: "100%",
    height: 250,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: "none",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
    marginRight: 10,
  },
  subtitle: {
    color: "#888",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  statBox: {
    alignItems: "center",
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
    paddingVertical: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    
  },
  activityText: {
    marginLeft: 10,
  },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
    margin: 16,
    marginBottom: 0
  },
  iconWrapper: {
    position: "absolute",
    left: 12,
    top: "38%",
    transform: [{ translateY: -10 }],
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
});
