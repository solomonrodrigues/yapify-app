import { useLocalSearchParams } from 'expo-router';
import { useUser } from '@/context/UserContext';
import UnifiedProfile from '@/components/UnifiedProfile';

export default function UserScreen() {
  const params = useLocalSearchParams();
  const { userID } = params;
  const { user } = useUser();

  const userId = parseInt(userID as string, 10);

  if (!user || isNaN(userId)) return null;

  return (
    <UnifiedProfile
      userId={userId}
      currentUser={user}
    />
  );
}
