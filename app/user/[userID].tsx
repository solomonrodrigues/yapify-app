import { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getUser } from '@/api/friends';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Colors } from '@/constants/Colors';
import type { PublicUser } from '@/types/api';

export default function UserScreen() {
  const params = useLocalSearchParams();
  const { userID } = params;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useThemedStyles(getStyles);

  useEffect(() => {
    if (!userID) return;
    (async () => {
      try {
        const data = await getUser(Number(userID));
        setUser(data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userID]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="subtitle">User not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Profile Info */}
          <View style={styles.profileContainer}>
            <InitialsAvatar user={user} size={100} style={{ marginBottom: 16 }} />
            <ThemedText type="title">{user.display_name}</ThemedText>
            <ThemedText style={styles.username}>@{user.username}</ThemedText>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText type="title">{user.total_quotes_posted}</ThemedText>
              <ThemedText>Posted</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText type="title">{user.total_quotes_received}</ThemedText>
              <ThemedText>Received</ThemedText>
            </View>
          </View>

          {/* Recent Quotes */}
          <View style={styles.section}>
            <ThemedText type="subtitle">Recent Quotes</ThemedText>
            {user.recent_quotes_posted ? (
              <View style={styles.sectionCard}>
                <IconSymbol name="quote.bubble.fill" size={20} color={"gray"} />
                <ThemedText style={styles.activityText}>
                  {user.recent_quotes_posted}
                </ThemedText>
              </View>
            ) : (
              <ThemedText>No recent quotes</ThemedText>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      padding: 16,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    username: {
      marginTop: 4,
      color: theme.secondaryText,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      marginHorizontal: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.cardBackground,
      alignItems: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.cardBackground,
    },
    activityText: {
      marginLeft: 8,
    },
  });
