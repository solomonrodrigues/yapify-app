// context/BlockedUsersContext.tsx
import { blockUser, getBlockedUsers, unblockUser } from "@/lib/api/users";
import { getErrorMessage } from "@/lib/utils/error";
import { PublicUser } from "@/types/api";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface BlockedUsersContextValue {
  blockedUserIds: Set<number>;
  blockedUsers: PublicUser[];
  loading: boolean;
  error: string | null;
  hasLoadedOnce: boolean;
  loadBlockedUsers: () => Promise<void>;
  blockUserById: (userId: number) => Promise<void>;
  unblockUserById: (userId: number) => Promise<void>;
  isUserBlocked: (userId: number) => boolean;
}

const BlockedUsersContext = createContext<BlockedUsersContextValue | undefined>(
  undefined
);

export function BlockedUsersProvider({ children }: { children: ReactNode }) {
  const [blockedUserIds, setBlockedUserIds] = useState<Set<number>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadBlockedUsers = useCallback(async () => {
    if (!hasLoadedOnce) {
      setLoading(true);
    }

    try {
      // Load all blocked users (paginate through all pages)
      let allUsers: PublicUser[] = [];
      let nextUrl: string | null = null;

      do {
        const response = await getBlockedUsers(nextUrl);
        allUsers = [...allUsers, ...response.results];
        nextUrl = response.next ?? null;
      } while (nextUrl);

      setBlockedUsers(allUsers);
      setBlockedUserIds(new Set(allUsers.map((u) => u.id)));
      setError(null);
      setHasLoadedOnce(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [hasLoadedOnce]);

  const blockUserById = useCallback(async (userId: number) => {
    // Optimistic update
    setBlockedUserIds((prev) => new Set([...prev, userId]));

    try {
      await blockUser(userId);
    } catch (err) {
      // Rollback on failure
      setBlockedUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      throw err;
    }
  }, []);

  const unblockUserById = useCallback(async (userId: number) => {
    // Store previous state for rollback
    const previousBlockedUsers = blockedUsers;
    const previousBlockedIds = blockedUserIds;

    // Optimistic update
    setBlockedUserIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));

    try {
      await unblockUser(userId);
    } catch (err) {
      // Rollback on failure
      setBlockedUserIds(previousBlockedIds);
      setBlockedUsers(previousBlockedUsers);
      throw err;
    }
  }, [blockedUsers, blockedUserIds]);

  const isUserBlocked = useCallback(
    (userId: number) => blockedUserIds.has(userId),
    [blockedUserIds]
  );

  return (
    <BlockedUsersContext.Provider
      value={{
        blockedUserIds,
        blockedUsers,
        loading,
        error,
        hasLoadedOnce,
        loadBlockedUsers,
        blockUserById,
        unblockUserById,
        isUserBlocked,
      }}
    >
      {children}
    </BlockedUsersContext.Provider>
  );
}

export function useBlockedUsers() {
  const context = useContext(BlockedUsersContext);
  if (!context) {
    throw new Error(
      "useBlockedUsers must be used within BlockedUsersProvider"
    );
  }
  return context;
}
