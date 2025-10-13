import { User, KindEnum, RecentSearchCreate, RecentSearchItem, MinimalUser } from '@/types/api';
import api from '@/lib/api/client';

/**
 * Touch (upsert) a recent item.
 * Server returns 204 on success.
 */
export const postRecent = async (payload: RecentSearchCreate): Promise<void> => {
    await api.post("/recents/", payload);
};

/**
 * List recent items (optionally filter by kind and limit).
 * GET /recents/?kind=user|quote&limit=10
 */
export const listRecents = async (opts?: {
    kind?: KindEnum;
    limit?: number;
}): Promise<RecentSearchItem[]> => {
    const res = await api.get<RecentSearchItem[]>("/recents/", {
        params: {
        kind: opts?.kind,
        limit: opts?.limit,
        },
    });
    return res.data ?? [];
};
  
/** Convenience: record a user click (fire-and-forget friendly). */
export const postRecentUserClick = async (
    user: Pick<User, "id">,
    query?: string
): Promise<void> => {
    const payload: RecentSearchCreate = {
        kind: "user",
        target_id: String(user.id),
        query,
    };
    await postRecent(payload);
};
  
/** Convenience: list only recent users. */
export const listRecentUsers = async (limit = 10): Promise<MinimalUser[]> => {
    const items = await listRecents({ kind: "user", limit });
    return items
      .map((it) => it.data as unknown as MinimalUser)
      .filter(Boolean);
};
  
/** Convenience: list only recent quotes. */
export const listRecentQuotes = async (limit = 10) =>
    listRecents({ kind: "quote", limit });
