import { Image } from 'expo-image';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Info */}
        <ThemedView style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.avatar}
          />
          <ThemedText type="title">John Doe</ThemedText>
          <ThemedText style={styles.subtitle}>@johndoe</ThemedText>
        </ThemedView>

        {/* Stats */}
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statBox}>
            <ThemedText type="title">245</ThemedText>
            <ThemedText>Posts</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statBox}>
            <ThemedText type="title">1.2k</ThemedText>
            <ThemedText>Followers</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statBox}>
            <ThemedText type="title">530</ThemedText>
            <ThemedText>Following</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Bio */}
        <ThemedView style={styles.section}>
          <ThemedText>
            Full-stack developer • Coffee lover ☕ • Traveler 🌍
          </ThemedText>
        </ThemedView>

        {/* Recent Activity */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recent Activity</ThemedText>
          <ThemedView style={styles.activityCard}>
            <ThemedText style={styles.activityText}>
              Starred "react-native-awesome" repo
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.activityCard}>
            <IconSymbol name="message.fill" size={20} color="#3498db" />
            <ThemedText style={styles.activityText}>
              Commented on "UI Ideas" thread
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  statBox: {
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  activityText: {
    marginLeft: 10,
  },
});