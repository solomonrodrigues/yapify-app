import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { useUser } from '@/context/UserContext';
import { Colors } from '@/constants/Colors';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function ProfileScreen() {
  const { user } = useUser()
  const styles = useThemedStyles(getStyles);

  if (!user) return null;

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ padding: 16 }}>

        {/* Header */}
        <View style={styles.header}>
          <InitialsAvatar user={user} size={80} />
          <View style={styles.headerText}>
            <ThemedText type="title">{user.display_name}</ThemedText>
            <ThemedText style={styles.username}>@{user.username}</ThemedText>
          </View>
        </View>

        {/* Bio */}
        {user.bio ? (
          <View style={styles.section}>
            <ThemedText>{user.bio}</ThemedText>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <ThemedText type="title">{user.quotes_count}</ThemedText>
            <ThemedText>Quotes</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText type="title">{user.friends_count}</ThemedText>
            <ThemedText>Friends</ThemedText>
          </View>
        </View>

        {/* Extra Info */}
        <View style={styles.sectionCard}>
          <ThemedText style={styles.extraLabel}>Joined</ThemedText>
          <ThemedText>
              {new Date(user.date_joined).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
          </ThemedText>

          {user.quote_visibility ? (
            <>
              <ThemedText style={[styles.extraLabel, { marginTop: 12 }]}>
                Quote Visibility
              </ThemedText>
              <ThemedText>
                {user.quote_visibility === 'mutuals'
                  ? 'Mutual Friends Only'
                  : 'Friends of Friends'}
              </ThemedText>
            </>
          ) : null}
        </View>

      </SafeAreaView>
    </View>
  );
}

const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerText: {
      marginLeft: 16,
      flex: 1,
    },
    username: {
      color: theme.secondaryText,
    },
    email: {
      color: theme.text,
      fontSize: 13,
      marginTop: 4,
    },
    section: {
      marginBottom: 20,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    statBox: {
      alignItems: 'center',
    },
    sectionCard: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.divider,
      backgroundColor: theme.cardBackground,
    },
    extraLabel: {
      fontWeight: '600',
      marginBottom: 4,
    },
  });
