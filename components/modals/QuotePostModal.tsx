import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from "react-native";
import { searchUsers, getFriends } from "@/api/friends";
import { createQuote } from "@/api/quotes";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { User, Quote } from "@/types/api";
import { getInitials } from "@/utils/user";

interface QuotePostModalProps {
  visible: boolean;
  onClose: () => void;
  onQuoteCreated?: (quote: Quote) => void;
}

const QuotePostModal: React.FC<QuotePostModalProps> = ({
  visible,
  onClose,
  onQuoteCreated,
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]); // Placeholder for future feature
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | { display_name: string; username: string; id: null } | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const [context, setContext] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const colorScheme = useColorScheme();

  // Load friends when modal opens
  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setQuoteText("");
      setContext("");
      setIsPublic(true);
    }
  }, [visible]);

  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      const friendsData = await getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const data = await searchUsers(text);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User | { display_name: string; username: string; id: null }) => {
    setSelectedUser(user);
  };

  const handleCustomQuote = () => {
    if (query.trim()) {
      const customUser = {
        display_name: query.trim(),
        username: query.trim().toLowerCase().replace(/\s+/g, ''),
        id: null,
      };
      setSelectedUser(customUser);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedUser || !quoteText.trim()) {
      Alert.alert('Error', 'Please select a user and enter a quote');
      return;
    }

    try {
      setCreatingQuote(true);
      
      const quoteData: Partial<Quote> = {
        text: quoteText.trim(),
        context: context.trim() || undefined,
        is_public: isPublic,
      };

      // Add quoted_user_id only if it's a real user
      if (selectedUser.id !== null) {
        quoteData.quoted_user_id = selectedUser.id;
      }

      const newQuote = await createQuote(quoteData);
      
      if (onQuoteCreated) {
        onQuoteCreated(newQuote);
      }
      
      Alert.alert('Success', 'Quote created successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating quote:', error);
      Alert.alert('Error', 'Failed to create quote');
    } finally {
      setCreatingQuote(false);
    }
  };

  const goBack = () => {
    setSelectedUser(null);
    setQuoteText("");
    setContext("");
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <InitialsAvatar initials={getInitials(item)} size={40} />
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>{item.display_name}</ThemedText>
        <ThemedText style={styles.username}>@{item.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: User[]) => {
    if (data.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#666' : '#888' }]}>
          {title.toUpperCase()}
        </Text>
        <FlatList
          data={data}
          keyExtractor={(item) => `${title}-${item.id}`}
          renderItem={renderUserItem}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const showCustomOption = query.length > 0 && searchResults.length === 0 && !loading;

  // User selection screen
  if (!selectedUser) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Let's <Text style={styles.quoteText}>quote</Text>
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? '#ccc' : '#666' }]}>
            whom?
          </Text>

          {/* Search Input */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.iconWrapper}>
              <IconSymbol
                size={20}
                name="magnifyingglass"
                color="#ccc"
              />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.input,
                {
                  color: colorScheme === "dark" ? 'white' : 'black',
                  borderColor: colorScheme === 'dark' ? '#333' : '#ccc',
                  backgroundColor: colorScheme === 'dark' ? '#111' : '#fff',
                },
              ]}
              placeholder="Search for friends..."
              placeholderTextColor="#999"
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <ThemedText style={styles.centerText}>Searching...</ThemedText>
            ) : query.length > 0 ? (
              <View>
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => `search-${item.id}`}
                    renderItem={renderUserItem}
                    style={styles.searchResults}
                  />
                )}
                
                {/* Custom Quote Option */}
                {showCustomOption && (
                  <TouchableOpacity
                    style={styles.customOption}
                    onPress={handleCustomQuote}
                  >
                    <View style={styles.customIconWrapper}>
                      <IconSymbol name="plus" size={20} color="#fff" />
                    </View>
                    <View style={styles.userInfo}>
                      <ThemedText style={styles.displayName}>Quote "{query}"</ThemedText>
                      <ThemedText style={styles.customText}>Create quote for custom name</ThemedText>
                    </View>
                  </TouchableOpacity>
                )}
                
                {searchResults.length === 0 && !showCustomOption && (
                  <ThemedText style={styles.centerText}>No users found</ThemedText>
                )}
              </View>
            ) : (
              <View>
                {friendsLoading ? (
                  <ThemedText style={styles.centerText}>Loading friends...</ThemedText>
                ) : (
                  <>
                    {renderSection("Recent", recentUsers)}
                    {renderSection("Friends", friends)}
                    
                    {recentUsers.length === 0 && friends.length === 0 && (
                      <ThemedText style={styles.centerText}>
                        Start typing to search for friends
                      </ThemedText>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // Quote creation screen
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.closeButton}>
            <IconSymbol name="chevron.left" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            New <Text style={styles.quoteText}>Quote</Text>
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        {/* Selected User */}
        <View style={styles.selectedUserContainer}>
          <View style={styles.selectedUser}>
            {selectedUser.id ? (
              <InitialsAvatar initials={getInitials(selectedUser as User)} size={50} />
            ) : (
              <View style={styles.customUserIcon}>
                <IconSymbol name="person" size={24} color="#fff" />
              </View>
            )}
            <View style={styles.userInfo}>
              <ThemedText style={styles.selectedDisplayName}>{selectedUser.display_name}</ThemedText>
              <ThemedText style={styles.selectedUsername}>
                {selectedUser.id ? `@${selectedUser.username}` : 'Custom name'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Quote Input */}
        <View style={styles.quoteInputContainer}>
          <Text style={[styles.inputLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Quote *
          </Text>
          <TextInput
            style={[
              styles.quoteInput,
              {
                color: colorScheme === 'dark' ? 'white' : 'black',
                borderColor: colorScheme === 'dark' ? '#333' : '#ccc',
                backgroundColor: colorScheme === 'dark' ? '#111' : '#fff',
              }
            ]}
            placeholder={`What did ${selectedUser.display_name} say?`}
            placeholderTextColor="#999"
            value={quoteText}
            onChangeText={setQuoteText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
            onSubmitEditing={() => {
                Keyboard.dismiss();       // closes keyboard when "Done" tapped
            }}
          />
        </View>

        {/* Context Input */}
        <View style={styles.quoteInputContainer}>
          <Text style={[styles.inputLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Context (Optional)
          </Text>
          <TextInput
            style={[
              styles.contextInput,
              {
                color: colorScheme === 'dark' ? 'white' : 'black',
                borderColor: colorScheme === 'dark' ? '#333' : '#ccc',
                backgroundColor: colorScheme === 'dark' ? '#111' : '#fff',
              }
            ]}
            placeholder="When/where was this said?"
            placeholderTextColor="#999"
            value={context}
            onChangeText={setContext}
          />
        </View>

        {/* Privacy Toggle */}
        <View style={styles.privacyContainer}>
          <TouchableOpacity
            style={styles.privacyToggle}
            onPress={() => setIsPublic(!isPublic)}
          >
            <View style={[styles.toggleButton, isPublic && styles.toggleActive]}>
              {isPublic && <IconSymbol name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={[styles.privacyLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              Make quote public
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, (!quoteText.trim() || creatingQuote) && styles.createButtonDisabled]}
          onPress={handleCreateQuote}
          disabled={!quoteText.trim() || creatingQuote}
        >
          <Text style={styles.createButtonText}>
            {creatingQuote ? 'Creating...' : 'Create Quote'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
  },
  quoteText: {
    color: '#ff1493',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '300',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  iconWrapper: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    paddingLeft: 45,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '500',
  },
  username: {
    fontSize: 14,
    opacity: 0.7,
  },
  customOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  customIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff1493',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customText: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  searchResults: {
    maxHeight: 300,
  },
  centerText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    opacity: 0.6,
  },
  // Quote creation screen styles
  selectedUserContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 20, 147, 0.1)',
  },
  customUserIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff1493',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDisplayName: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedUsername: {
    fontSize: 14,
    opacity: 0.7,
  },
  quoteInputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  quoteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  contextInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  privacyContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff1493',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleActive: {
    backgroundColor: '#ff1493',
  },
  privacyLabel: {
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#ff1493',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#666',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default QuotePostModal;
