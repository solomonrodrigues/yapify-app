// hooks/useQuotesFeed.tsx
import type { FeedScope } from "@/lib/api/quotes";
import {
  deleteQuote,
  getQuotes,
  guessQuote,
  hideQuote,
  likeQuote,
  respondToQuote,
  saveQuote,
  unhideQuote,
  unsaveQuote,
  witnessQuote,
} from "@/lib/api/quotes";
import { getErrorMessage } from "@/lib/utils/error";
import { PaginatedQuoteList, Quote } from "@/types/api";
import {
  useCallback,
  useMemo,
  useState,
} from "react";

type QuotesFetcher = (
  url?: string | null,
  scope?: FeedScope | null
) => Promise<PaginatedQuoteList>;

export interface QuotesFeedValue {
  quotes: Quote[];
  initialLoading: boolean;
  refreshing: boolean;
  error: string | null;
  hasLoadedOnce: boolean;

  // pagination
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;

  // core actions
  loadQuotes: (isRefresh?: boolean) => Promise<void>;
  refreshQuotes: () => Promise<void>;
  likeQuoteById: (id: number) => Promise<void>;
  witnessQuoteById: (id: number) => Promise<void>;
  guessQuoteById: (
    id: number,
    guessedUserId?: number,
    skipped?: boolean
  ) => Promise<void>;
  saveQuoteById: (id: number) => Promise<void>;
  unsaveQuoteById: (id: number) => Promise<void>;
  hideQuoteById: (id: number) => Promise<void>;
  unhideQuoteById: (id: number) => Promise<void>;
  deleteQuoteById: (id: number) => Promise<void>;
  respondToQuoteById: (id: number, response: 'confirmed' | 'denied' | null) => Promise<void>;
}

interface UseQuotesFeedOptions {
  scope?: FeedScope | null;
  fetcher?: QuotesFetcher;
}

/**
 * Core reusable feed logic. Works for main feed (no scope) and scoped feeds (user, org, etc).
 */
export function useQuotesFeed(
  { scope = null, fetcher }: UseQuotesFeedOptions = {}
): QuotesFeedValue {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // pagination
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);

  const fetchQuotes = useMemo<QuotesFetcher>(
    () => fetcher ?? getQuotes,
    [fetcher]
  );

  const loadQuotes = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedOnce) {
        setInitialLoading(true);
      }

      try {
        // IMPORTANT: pass scope here
        const data: PaginatedQuoteList = await fetchQuotes(null, scope ?? null);

        setQuotes(data.results || []);
        setNextPage(data.next ?? null);
        setHasMore(!!data.next);

        setError(null);
        setHasLoadedOnce(true);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setInitialLoading(false);
        }
      }
    },
    [scope, hasLoadedOnce, fetchQuotes]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextPage || refreshing || initialLoading) return;

    setIsLoadingMore(true);
    try {
      const response: PaginatedQuoteList = await fetchQuotes(
        nextPage,
        scope ?? null
      );
      setQuotes((prev) => [...prev, ...response.results]);
      setNextPage(response.next ?? null);
      setHasMore(!!response.next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more quotes"
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, initialLoading, isLoadingMore, nextPage, refreshing, scope, fetchQuotes]);

  const likeQuoteById = useCallback(async (id: number) => {
    // optimistic update
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;

        const wasLiked = q.is_liked;
        const newLiked = !wasLiked;

        return {
          ...q,
          is_liked: newLiked,
          like_count: q.like_count + (newLiked ? 1 : -1),
        };
      })
    );

    try {
      await likeQuote(id);
    } catch (e) {
      console.error(e);
      // rollback on failure
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                is_liked: !q.is_liked,
                like_count: q.like_count + (q.is_liked ? -1 : 1),
              }
            : q
        )
      );
    }
  }, []);

  const witnessQuoteById = useCallback(async (id: number) => {
    // optimistic update
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;

        const wasWitnessed = q.is_witnessed;
        const newWitnessed = !wasWitnessed;

        return {
          ...q,
          is_witnessed: newWitnessed,
          witness_count: q.witness_count + (newWitnessed ? 1 : -1),
        };
      })
    );

    try {
      await witnessQuote(id);
    } catch (e) {
      console.error(e);
      // rollback on failure
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                is_witnessed: !q.is_witnessed,
                witness_count:
                  q.witness_count + (q.is_witnessed ? -1 : 1),
              }
            : q
        )
      );
    }
  }, []);

  const guessQuoteById = useCallback(
    async (id: number, guessedUserId?: number, skipped = false) => {
      // optimistic: mark as guessed immediately
      setQuotes((prev) =>
        prev.map((q) =>
          q.id !== id
            ? q
            : {
                ...q,
                has_guessed: true,
                guess: {
                  id: -1, // temp
                  user: 0,
                  quote: q.id,
                  guessed_user: guessedUserId ?? null,
                  correct: null,
                  skipped,
                  created_at: new Date().toISOString(),
                },
                remaining_skips: q.remaining_skips - (skipped ? 1 : 0),
              }
        )
      );

      try {
        const result = await guessQuote(id, guessedUserId, skipped);
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === id ? { ...q, guess: result, has_guessed: true } : q
          )
        );
      } catch (e: any) {
        console.error("Failed to submit guess", e);
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  has_guessed: false,
                  guess: null,
                  remaining_skips:
                    q.remaining_skips + (skipped ? 1 : 0),
                }
              : q
          )
        );
        if (e.response?.data?.detail) {
          alert(e.response.data.detail);
        }
      }
    },
    []
  );

  const saveQuoteById = useCallback(async (id: number) => {
    // optimistic update: mark quote as saved
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        return {
          ...q,
          is_saved: true,
        };
      })
    );

    try {
      await saveQuote(id);
    } catch (e) {
      console.error(e);
      // rollback on failure
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                is_saved: false,
              }
            : q
        )
      );
    }
  }, []);

  const unsaveQuoteById = useCallback(
    async (id: number) => {
      // optimistic update: mark quote as unsaved
      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          return {
            ...q,
            is_saved: false,
          };
        })
      );

      try {
        await unsaveQuote(id);
      } catch (e) {
        console.error(e);
        // rollback on failure
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  is_saved: true,
                }
              : q
          )
        );
      }
    },
    []
  );

  const hideQuoteById = useCallback(async (id: number) => {
    // optimistic update: mark quote as hidden
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        return {
          ...q,
          is_hidden: true,
        };
      })
    );

    try {
      await hideQuote(id);
    } catch (e) {
      console.error(e);
      // rollback on failure
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                is_hidden: false,
              }
            : q
        )
      );
    }
  }, []);

  const unhideQuoteById = useCallback(async (id: number) => {
    // optimistic update: mark quote as not hidden
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        return {
          ...q,
          is_hidden: false,
        };
      })
    );

    try {
      await unhideQuote(id);
    } catch (e) {
      console.error(e);
      // rollback on failure
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                is_hidden: true,
              }
            : q
        )
      );
    }
  }, []);

  const deleteQuoteById = useCallback(async (id: number) => {
    try {
      await deleteQuote(id);
      // Remove the quote from the list after successful deletion
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      console.error(e);
      throw e; // Re-throw to allow caller to handle error
    }
  }, []);

  const respondToQuoteById = useCallback(
    async (id: number, response: 'confirmed' | 'denied' | null) => {
      // Store previous state for rollback
      let previousResponse: 'confirmed' | 'denied' | null = null;

      // optimistic update
      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          previousResponse = q.quoted_user_response as 'confirmed' | 'denied' | null;
          return {
            ...q,
            quoted_user_response: response,
            can_respond: true, // user can still change their response
          };
        })
      );

      try {
        await respondToQuote(id, response);
      } catch (e) {
        console.error(e);
        // rollback on failure
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  quoted_user_response: previousResponse,
                }
              : q
          )
        );
      }
    },
    []
  );

  const refreshQuotes = useCallback(async () => {
    await loadQuotes(true);
  }, [loadQuotes]);

  return {
    quotes,
    initialLoading,
    refreshing,
    error,
    hasLoadedOnce,
    isLoadingMore,
    hasMore,
    loadMore,
    loadQuotes,
    refreshQuotes,
    likeQuoteById,
    witnessQuoteById,
    guessQuoteById,
    saveQuoteById,
    unsaveQuoteById,
    hideQuoteById,
    unhideQuoteById,
    deleteQuoteById,
    respondToQuoteById,
  };
}
