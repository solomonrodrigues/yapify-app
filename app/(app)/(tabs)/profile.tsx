import { useUser } from '@/context/UserContext';
import UnifiedProfile from '@/components/UnifiedProfile';

export default function ProfileScreen() {
  const { user } = useUser()

  if (!user) return null;

  return (
    <UnifiedProfile 
      currentUser={user}
    />
  );
}
