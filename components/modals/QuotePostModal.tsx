import { InitialsAvatar } from "@/components/InitialsAvatar";
import { SkeletonUserItem } from "@/components/Skeleton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { useGroups } from "@/context/GroupsContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getGroupMembers, Group, GroupMember } from "@/lib/api/groups";
import { createQuote } from "@/lib/api/quotes";
import { hexToRgba } from "@/lib/utils/style";
import { Quote } from "@/types/api";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useToast } from "@/context/ToastContext";

const QUOTE_MAX_LENGTH = 280;

interface QuotePostModalProps {
  visible: boolean;
  onClose: () => void;
  onQuoteCreated?: (quote: Quote) => void;
}

type SelectedUser = { display_name: string; username: string; id: number | null; profile_color?: string };

const QuotePostModal: React.FC<QuotePostModalProps> = ({
  visible,
  onClose,
  onQuoteCreated,
}) => {
  const { groups, currentGroup } = useGroups();
  // Local selection: defaults to currentGroup, then first group. User can override per-quote.
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const activeGroup: Group | null = selectedGroup ?? currentGroup ?? groups[0] ?? null;
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);

  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<GroupMember[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const [contextText, setContextText] = useState("");
  const [creatingQuote, setCreatingQuote] = useState(false);
  const { toast } = useToast();
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

  // Load group members when modal opens
  useEffect(() => {
    if (visible && activeGroup) {
      loadMembers();
    }
  }, [visible, activeGroup?.id]);

  const loadMembers = async () => {
    if (!activeGroup) return;
    setMembersLoading(true);
    try {
      const data = await getGroupMembers(activeGroup.id);
      setMembers(data.results);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setQuoteText("");
      setContextText("");
      setSelectedGroup(null);
      setGroupPickerVisible(false);
    }
  }, [visible]);

  const handleGroupChange = async (group: Group) => {
    Haptics.selectionAsync();
    setSelectedGroup(group);
    setGroupPickerVisible(false);
    // Re-run any active search in the new group's context. Members differ across groups,
    // so old results are stale, but the user's typed query usually still applies.
    setSearchResults([]);
    setSelectedUser(null);
    if (query.length >= 2) {
      try {
        setSearchLoading(true);
        const data = await getGroupMembers(group.id, null, query);
        setSearchResults(data.results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    if (!activeGroup) return;

    try {
      setSearchLoading(true);
      const data = await getGroupMembers(activeGroup.id, null, text);
      setSearchResults(data.results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserSelect = (member: GroupMember) => {
    Haptics.selectionAsync();
    setSelectedUser({
      id: member.user.id,
      display_name: member.user.display_name,
      username: member.user.username,
      profile_color: member.user.profile_color,
    });
  };

  const handleCustomQuote = () => {
    if (query.trim()) {
      setSelectedUser({
        display_name: query.trim(),
        username: query.trim().toLowerCase().replace(/\s+/g, ''),
        id: null,
      });
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedUser || !quoteText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.show({ variant: 'danger', label: 'Please select a user and enter a quote' });
      return;
    }

    try {
      setCreatingQuote(true);

      const quoteData: Partial<Quote> & { group_id?: number } = {
        text: quoteText.trim(),
        ...(contextText.trim() ? { context: contextText.trim() } : {}),
      };

      if (selectedUser.id !== null) {
        quoteData.quoted_user_id = selectedUser.id;
      } else {
        quoteData.quoted_name = selectedUser.display_name;
      }

      if (activeGroup) {
        quoteData.group_id = activeGroup.id;
      }

      const newQuote = await createQuote(quoteData);

      if (onQuoteCreated) {
        onQuoteCreated(newQuote);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show({ variant: 'success', label: 'Quote created!' });
      onClose();
    } catch (error) {
      console.error('Error creating quote:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({ variant: 'danger', label: 'Failed to create quote' });
    } finally {
      setCreatingQuote(false);
    }
  };

  const goBack = () => {
    setSelectedUser(null);
    setQuoteText("");
    setContextText("");
  };

  const handleMembersScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (query.length > 0) return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) {
      // Could load more members here if pagination is needed
    }
  };

  const displayList = query.length > 0 ? searchResults : members;
  const isSearchLoading = query.length > 0 ? searchLoading : membersLoading;

  const renderMemberItem = (member: GroupMember) => (
    <TouchableOpacity
      key={member.user.id}
      style={styles.userItem}
      onPress={() => handleUserSelect(member)}
    >
      <InitialsAvatar user={member.user} size={40} />
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>{member.user.display_name}</ThemedText>
        <ThemedText style={styles.username}>@{member.user.username}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  // User selection screen
  if (!selectedUser) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

          {activeGroup && (
            <TouchableOpacity
              style={styles.groupLabel}
              onPress={() => groups.length > 1 && setGroupPickerVisible(true)}
              disabled={groups.length <= 1}
              activeOpacity={0.6}
            >
              <IconSymbol name="person.2.fill" size={12} color={theme.secondaryText} style={{ marginRight: 4 }} />
              <ThemedText style={styles.groupLabelText}>{activeGroup.name}</ThemedText>
              {groups.length > 1 && (
                <IconSymbol name="chevron.down" size={10} color={theme.secondaryText} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          )}

          {!activeGroup ? (
            <View style={styles.noGroupContainer}>
              <IconSymbol name="person.2" size={40} color={theme.border} />
              <ThemedText style={styles.centerText}>Join or create a group first</ThemedText>
            </View>
          ) : (
            <>
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

              <ScrollView
                style={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScroll={handleMembersScroll}
                scrollEventThrottle={200}
              >
                {isSearchLoading ? (
                  <View>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonUserItem key={i} />
                    ))}
                  </View>
                ) : query.length > 0 ? (
                  <View>
                    {displayList.length > 0 && (
                      <View style={styles.searchResults}>
                        {displayList.map((m) => renderMemberItem(m))}
                      </View>
                    )}
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
                    {displayList.length === 0 && !query.trim() && (
                      <ThemedText style={styles.centerText}>No members found</ThemedText>
                    )}
                  </View>
                ) : (
                  <View>
                    {membersLoading ? (
                      <View>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <SkeletonUserItem key={i} />
                        ))}
                      </View>
                    ) : members.length === 0 ? (
                      <ThemedText style={styles.centerText}>No group members yet</ThemedText>
                    ) : (
                      members.map((m) => renderMemberItem(m))
                    )}
                  </View>
                )}
              </ScrollView>
            </>
          )}

          <Modal
            visible={groupPickerVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setGroupPickerVisible(false)}
          >
            <TouchableOpacity
              style={styles.pickerBackdrop}
              activeOpacity={1}
              onPress={() => setGroupPickerVisible(false)}
            >
              <View style={styles.pickerSheet}>
                <ThemedText style={styles.pickerTitle}>Post to which group?</ThemedText>
                <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
                  {groups.map((g) => {
                    const isActive = activeGroup?.id === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={styles.pickerItem}
                        onPress={() => handleGroupChange(g)}
                      >
                        <IconSymbol
                          name="person.2.fill"
                          size={14}
                          color={isActive ? theme.accent : theme.secondaryText}
                          style={{ marginRight: 10 }}
                        />
                        <ThemedText
                          style={[
                            styles.pickerItemText,
                            isActive && { color: theme.accent, fontWeight: '600' },
                          ]}
                        >
                          {g.name}
                        </ThemedText>
                        {isActive && (
                          <IconSymbol
                            name="checkmark"
                            size={14}
                            color={theme.accent}
                            style={{ marginLeft: 'auto' }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.creationContent}
        >
          {/* Selected User */}
          <View style={styles.selectedUserContainer}>
            <View style={styles.selectedUser}>
              {selectedUser.id ? (
                <InitialsAvatar user={selectedUser as import('@/types/api').MinimalUser} size={50} />
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
                  borderBottomColor: contextText.trim() ? theme.accent : (colorScheme === 'dark' ? '#222' : '#ddd'),
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
              {creatingQuote ? (
                <View style={styles.createButtonInner}>
                  <ActivityIndicator size="small" color={theme.buttonText} style={{ marginRight: 8 }} />
                  <Text style={styles.createButtonText}>Creating...</Text>
                </View>
              ) : (
                <Text style={styles.createButtonText}>Create Quote</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    color: theme.accent,
  },
  groupLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  groupLabelText: {
    fontSize: 12,
    color: theme.secondaryText,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  pickerSheet: {
    backgroundColor: theme.modalBackground,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  pickerItemText: {
    fontSize: 16,
  },
  noGroupContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
    borderBottomColor: theme.accent,
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
    backgroundColor: theme.accent,
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
    backgroundColor: hexToRgba(theme.accent, 0.2),
  },
  customUserIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.accent,
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
  creationContent: {
    flexGrow: 1,
  },
  quoteContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  quotePrefix: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: Spacing.md,
  },
  quoteInputWrapper: {
    borderBottomWidth: 2,
    borderBottomColor: theme.accent,
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
    backgroundColor: theme.accent,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xxxl + Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonInner: {
    flexDirection: 'row',
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
