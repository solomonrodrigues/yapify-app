import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/hooks/useUser';
import { getInitials } from '@/utils/user';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserScreen() {
  const params = useLocalSearchParams();
  const { userID } = params;
  console.log(params);

  const { user } = useUser();
  
  // TODO: fix this!!!!
  // const [user, setUser] = useState<User>();
  


  return (
    <ThemedView style={{padding: 16}}>
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <InitialsAvatar initials={getInitials(user)} size={100} style={{marginBottom: 24}} />
          <ThemedText type="title">{user?.display_name}</ThemedText>
          
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <ThemedText type="title">245</ThemedText>
            <ThemedText>Posts</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText type="title">0k</ThemedText>
            <ThemedText>Followers</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText type="title">100</ThemedText>
            <ThemedText>Following</ThemedText>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <ThemedText>
            Some dude
          </ThemedText>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Recent Activity</ThemedText>
          <View style={styles.activityCard}>
            <ThemedText style={styles.activityText}>
              "idk..."
            </ThemedText>
          </View>
          <View style={styles.activityCard}>
            <IconSymbol name="message.fill" size={20} color="#3498db" />
            <ThemedText style={styles.activityText}>
              This is user page
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </ThemedView>
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
    backgroundColor: 'none',
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
  },
  activityText: {
    marginLeft: 10,
  },
});