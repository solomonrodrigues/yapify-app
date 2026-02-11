import { InitialsAvatar } from "@/components/InitialsAvatar";
import { SkeletonUserItem } from "@/components/Skeleton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getFriends, getRecentFriends, searchFriends } from "@/lib/api/friends";
import { createQuote } from "@/lib/api/quotes";
import { hexToRgba } from "@/lib/utils/style";
import { Quote, User } from "@/types/api";
import { LegendList } from "@legendapp/list";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Toast from "react-native-toast-message";

const QUOTE_MAX_LENGTH = 280;

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
  const [contextText, setContextText] = useState("");
  const [creatingQuote, setCreatingQuote] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const styles = useThemedStyles(getStyles);
  const buttonScale = useSharedValue(1);

  const charCountColor = quoteText.length > QUOTE_MAX_LENGTH
    ? '#FF3B30'
    : quoteText.length > QUOTE_MAX_LENGTH * 0.85
      ? '#FF9500'
      : colorScheme === 'dark' ? '#666' : '#999';

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Load friends when modal opens
  useEffect(() => {
    if (visible) {
      loadFriends();
      loadRecent();
    }
  }, [visible]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setQuoteText("");
      setContextText("");
    }
  }, [visible]);

  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      const friendsData = await getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
      Toast.show({ type: 'error', text1: 'Failed to load friends' });
    } finally {
      setFriendsLoading(false);
    }
  };

  const loadRecent = async () => {
    try {
      setFriendsLoading(true);
      const recentData = await getRecentFriends();
      setRecentUsers(recentData);
    } catch (error) {
      console.error('Error loading recent friends:', error);
      Toast.show({ type: 'error', text1: 'Failed to load recent friends' });
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
      const data = await searchFriends(text);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User | { display_name: string; username: string; id: null }) => {
    Haptics.selectionAsync();
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Toast.show({ type: 'error', text1: 'Please select a user and enter a quote' });
      return;
    }

    try {
      setCreatingQuote(true);

      const quoteData: Partial<Quote> = {
        text: quoteText.trim(),
        ...(contextText.trim() ? { context: contextText.trim() } : {}),
      };

      // Add quoted_user_id only if it's a real user
      if (selectedUser.id !== null) {
        quoteData.quoted_user_id = selectedUser.id;
      } else {
        quoteData.quoted_name = selectedUser.display_name;
      }

      const newQuote = await createQuote(quoteData);

      if (onQuoteCreated) {
        onQuoteCreated(newQuote);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Quote created!' });
      onClose();
    } catch (error) {
      console.error('Error creating quote:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Failed to create quote' });
    } finally {
      setCreatingQuote(false);
    }
  };

  const goBack = () => {
    setSelectedUser(null);
    setQuoteText("");
    setContextText("");
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <InitialsAvatar user={item} size={40} />
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
        <LegendList
          data={data}
          keyExtractor={(item) => `${title}-${item.id}`}
          renderItem={renderUserItem}
          scrollEnabled={false}
        />
      </View>
    );
  };

  // User selection screen
  if (!selectedUser) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        {/* Header */}
        <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Let&apos;s <Text style={styles.quoteText}>quote</Text>
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
        </View>

        {/* Integrated Search Input */}
        <View style={styles.searchContainer}>
            <Text style={[styles.subtitlePrefix, { color: colorScheme === 'dark' ? '#ccc' : '#666' }]}>
            whom?
            </Text>
            <View style={styles.integratedInputContainer}>
            <TextInput
                style={[
                styles.integratedInput,
                {
                    color: colorScheme === "dark" ? 'white' : 'black',
                    borderBottomColor: colorScheme === 'dark' ? '#333' : '#ccc',
                },
                ]}
                placeholder="Start typing a name..."
                placeholderTextColor="#999"
                value={query}
                onChangeText={handleSearch}
                autoCapitalize="words"
                autoFocus
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
            />
            </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
            {loading ? (
            <View>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonUserItem key={i} />
              ))}
            </View>
            ) : query.length > 0 ? (
            <View>
                {/* Search Results */}
                {searchResults.length > 0 && (
                <LegendList
                    data={searchResults}
                    keyExtractor={(item) => `search-${item.id}`}
                    renderItem={renderUserItem}
                    style={styles.searchResults}
                />
                )}
                
                {/* Custom Quote Option */}
                {query.trim() && (
                <TouchableOpacity
                    style={styles.customOption}
                    onPress={handleCustomQuote}
                >
                    <View style={styles.customIconWrapper}>
                    <IconSymbol name="plus" size={20} color="#fff" />
                    </View>
                    <View style={styles.userInfo}>
                    <ThemedText style={styles.displayName}>Quote &ldquo;{query.trim()}&rdquo;</ThemedText>
                    <ThemedText style={styles.customText}>Create quote for custom name</ThemedText>
                    </View>
                </TouchableOpacity>
                )}
                
                {searchResults.length === 0 && !query.trim() && (
                <ThemedText style={styles.centerText}>No users found</ThemedText>
                )}
            </View>
            ) : (
            <View>
                {friendsLoading ? (
                <View>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonUserItem key={i} />
                  ))}
                </View>
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
        </TouchableWithoutFeedback>
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
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
              <InitialsAvatar user={selectedUser as User} size={50} />
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
        <View style={styles.quoteContainer}>
          <Text style={[styles.quotePrefix, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            &ldquo;{selectedUser.display_name}&rdquo; said...
          </Text>
          <View style={styles.quoteInputWrapper}>
            <TextInput
              style={[
                styles.quoteTextInput,
                {
                  color: colorScheme === 'dark' ? 'white' : 'black',
                  borderBottomColor: colorScheme === 'dark' ? '#333' : '#ccc',
                }
              ]}
              placeholder="What did they say?"
              placeholderTextColor="#999"
              value={quoteText}
              onChangeText={setQuoteText}
              multiline
              autoFocus
            />
          </View>
        </View>

        {/* Character Count */}
        <View style={styles.charCountContainer}>
          <Text style={[styles.charCountText, { color: charCountColor }]}>
            {quoteText.length}/{QUOTE_MAX_LENGTH}
          </Text>
        </View>

        {/* Context (optional) */}
        <View style={styles.contextContainer}>
          <Text style={[styles.contextLabel, { color: colorScheme === 'dark' ? '#666' : '#999' }]}>
            context <Text style={styles.optionalHint}>(optional)</Text>
          </Text>
          <TextInput
            style={[
              styles.contextInput,
              {
                color: colorScheme === 'dark' ? 'white' : 'black',
                borderBottomColor: contextText.trim() ? theme.pastels.purple : (colorScheme === 'dark' ? '#222' : '#ddd'),
              }
            ]}
            placeholder="What led to this quote?"
            placeholderTextColor={colorScheme === 'dark' ? '#444' : '#bbb'}
            value={contextText}
            onChangeText={setContextText}
            maxLength={150}
          />
          <Text style={[styles.contextHelp, { color: colorScheme === 'dark' ? '#555' : '#aaa' }]}>
            Where it happened, what they were talking about, or anything that adds to the story
          </Text>
        </View>

        {/* Create Button */}
        <Animated.View style={animatedButtonStyle}>
          <TouchableOpacity
            style={[styles.createButton, (!quoteText.trim() || creatingQuote || quoteText.length > QUOTE_MAX_LENGTH) && styles.createButtonDisabled]}
            onPress={handleCreateQuote}
            onPressIn={() => { buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
            onPressOut={() => { buttonScale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
            disabled={!quoteText.trim() || creatingQuote || quoteText.length > QUOTE_MAX_LENGTH}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>
              {creatingQuote ? 'Creating...' : 'Create Quote'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.modalBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
  },
  quoteText: {
    color: theme.pastels.purple,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  subtitlePrefix: {
    fontSize: 28,
    fontWeight: '300',
    marginBottom: Spacing.sm,
  },
  integratedInputContainer: {
    borderBottomWidth: 2,
    borderBottomColor: theme.pastels.purple,
  },
  integratedInput: {
    fontSize: 28,
    fontWeight: '300',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
    minHeight: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  userInfo: {
    marginLeft: Spacing.sm + Spacing.xs,
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
    paddingVertical: Spacing.sm + Spacing.xs,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
  },
  customIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.pastels.purple,
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
    marginTop: Spacing.xxl,
    fontSize: 16,
    opacity: 0.6,
  },
  // Quote creation screen styles
  selectedUserContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    backgroundColor: hexToRgba(theme.pastels.purple, 0.2),
  },
  customUserIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.pastels.purple,
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
  quoteContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    flex: 1,
  },
  quotePrefix: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: Spacing.md,
  },
  quoteInputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: theme.pastels.purple,
  },
  quoteTextInput: {
    fontSize: 24,
    fontWeight: '300',
    paddingVertical: 10,
    paddingHorizontal: 0,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCountContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  contextContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  contextLabel: {
    fontSize: 14,
    fontWeight: '300',
    marginBottom: Spacing.xs,
  },
  optionalHint: {
    fontSize: 12,
    fontWeight: '300',
    opacity: 0.5,
  },
  contextInput: {
    fontSize: 16,
    fontWeight: '300',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  contextHelp: {
    fontSize: 12,
    fontWeight: '300',
    marginTop: Spacing.xs + 2,
    lineHeight: 16,
  },
  charCountText: {
    fontSize: 13,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: theme.pastels.purple,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xxxl + Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: theme.buttonDisabled,
  },
  createButtonText: {
    color: theme.buttonText,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default QuotePostModal;
