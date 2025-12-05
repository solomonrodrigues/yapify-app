import { useLocalSearchParams } from 'expo-router';
import { useUser } from '@/context/UserContext';
import UnifiedProfile from '@/components/UnifiedProfile';

export default function UserScreen() {
  const params = useLocalSearchParams();
  const { userID } = params;
  const { user } = useUser();

  if (!user) return null;

  return (
    <UnifiedProfile 
      userId={parseInt(userID as string)}
      currentUser={user}
    />
  );
}
