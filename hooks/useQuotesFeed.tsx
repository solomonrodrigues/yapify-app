// hooks/useQuotesFeed.tsx
import type { FeedScope } from "@/lib/api/quotes";
import {
  assignUserToQuote,
  deleteQuote,
  getQuotes,
  guessQuote,
  hideQuote,
  likeQuote,
  respondToQuote,
  saveQuote,
  unhideQuote,
  unsaveQuote,
  updateQuote,
  witnessQuote,
} from "@/lib/api/quotes";
import { getErrorMessage } from "@/lib/utils/error";
import { useUser } from "@/context/UserContext";
import { MinimalUser, PaginatedQuoteList, Quote } from "@/types/api";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

export type MilestoneMessage = { text1: string; text2: string };

const STREAK_MILESTONES = [5, 10, 25, 50, 100] as const;
const MILESTONE_MESSAGES: Record<number, MilestoneMessage> = {
  5:   { text1: '🔥 5 streak!',   text2: 'Keep it going.' },
  10:  { text1: '🔥 10 streak!',  text2: "You're on fire." },
  25:  { text1: '🔥 25 streak!',  text2: 'Absolutely unstoppable.' },
  50:  { text1: '🔥 50 streak!',  text2: 'Legendary.' },
  100: { text1: '🔥 100 streak!', text2: 'Hall of fame.' },
};

// Simple global visibility bus so that hide/unhide actions
// propagate across all active quote feeds (main feed, profile feeds, saved feed, etc).
type QuoteVisibilityAction = "hide" | "unhide";
type QuoteVisibilityListener = (id: number, action: QuoteVisibilityAction) => void;

const quoteVisibilityListeners = new Set<QuoteVisibilityListener>();

const registerQuoteVisibilityListener = (listener: QuoteVisibilityListener) => {
  quoteVisibilityListeners.add(listener);
  return () => {
    quoteVisibilityListeners.delete(listener);
  };
};

const notifyQuoteVisibilityChange = (id: number, action: QuoteVisibilityAction) => {
  quoteVisibilityListeners.forEach((listener) => {
    try {
      listener(id, action);
    } catch (e) {
      console.error("Error in quote visibility listener", e);
    }
  });
};

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
  ) => Promise<{ milestoneMessage?: MilestoneMessage } | null>;
  saveQuoteById: (id: number) => Promise<void>;
  unsaveQuoteById: (id: number) => Promise<void>;
  hideQuoteById: (id: number) => Promise<void>;
  unhideQuoteById: (id: number) => Promise<void>;
  deleteQuoteById: (id: number) => Promise<void>;
  respondToQuoteById: (id: number, response: 'confirmed' | 'denied' | null) => Promise<void>;
  updateQuoteById: (id: number, updates: { text?: string; context?: string | null }) => Promise<void>;
  assignUserToQuoteById: (id: number, user: MinimalUser) => Promise<void>;
  removeQuotesInvolvingUser: (userId: number) => void;
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
  const { user, patchUser } = useUser();
  const prevLongestRef = useRef(user?.longest_streak ?? 0);
  useEffect(() => {
    prevLongestRef.current = user?.longest_streak ?? 0;
  }, [user]);

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

  // Subscribe this feed instance to global hide/unhide events so that
  // a quote hidden from any screen is reflected everywhere immediately.
  useEffect(() => {
    const listener: QuoteVisibilityListener = (id, action) => {
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                is_hidden: action === "hide",
              }
            : q
        )
      );
    };

    const unregister = registerQuoteVisibilityListener(listener);
    return unregister;
  }, []);

  const loadQuotes = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedOnce) {
        setInitialLoading(true);
      }

      try {
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

        // Destructure streak fields out before storing as QuoteGuess
        const { current_streak, longest_streak, ...guessData } = result;
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === id ? { ...q, guess: guessData, has_guessed: true } : q
          )
        );

        // Update in-memory user profile with latest streak values
        patchUser({ current_streak, longest_streak });

        // Compute milestone message for the caller to display inline
        if (result.correct === true) {
          const isMilestone = (STREAK_MILESTONES as readonly number[]).includes(current_streak);
          if (isMilestone) {
            return { milestoneMessage: MILESTONE_MESSAGES[current_streak] };
          } else if (longest_streak > prevLongestRef.current && current_streak > 1) {
            return {
              milestoneMessage: {
                text1: 'New personal best!',
                text2: `${current_streak} in a row`,
              },
            };
          }
          return {};
        }
        return null;
      } catch (e) {
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
        Alert.alert('Error', getErrorMessage(e));
        return null;
      }
    },
    [patchUser]
  );

  const saveQuoteById = useCallback(async (id: number) => {
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
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        return {
          ...q,
          is_hidden: true,
        };
      })
    );

    // Also propagate to all other feeds
    notifyQuoteVisibilityChange(id, "hide");

    try {
      await hideQuote(id);
    } catch (e) {
      console.error(e);
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
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        return {
          ...q,
          is_hidden: false,
        };
      })
    );

    // Also propagate to all other feeds
    notifyQuoteVisibilityChange(id, "unhide");

    try {
      await unhideQuote(id);
    } catch (e) {
      console.error(e);
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
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, []);

  const respondToQuoteById = useCallback(
    async (id: number, response: 'confirmed' | 'denied' | null) => {
      let previousResponse: 'confirmed' | 'denied' | null = null;

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

  const updateQuoteById = useCallback(
    async (id: number, updates: { text?: string; context?: string | null }) => {
      let previousText: string | undefined;
      let previousContext: string | null | undefined;

      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          previousText = q.text;
          previousContext = q.context;
          return {
            ...q,
            ...(updates.text !== undefined ? { text: updates.text } : {}),
            ...(updates.context !== undefined ? { context: updates.context } : {}),
          };
        })
      );

      try {
        const updated = await updateQuote(id, updates);
        setQuotes((prev) =>
          prev.map((q) => (q.id === id ? { ...q, ...updated } : q))
        );
      } catch (e) {
        console.error("Failed to update quote", e);
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  text: previousText!,
                  context: previousContext,
                }
              : q
          )
        );
        throw e;
      }
    },
    []
  );

  const assignUserToQuoteById = useCallback(
    async (id: number, user: MinimalUser) => {
      let previousQuotedUser: Quote["quoted_user"] | undefined;
      let previousQuotedName: Quote["quoted_name"] | undefined;

      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          previousQuotedUser = q.quoted_user;
          previousQuotedName = q.quoted_name;
          return {
            ...q,
            quoted_user: user as Quote["quoted_user"],
            quoted_name: null,
          };
        })
      );

      try {
        const updated = await assignUserToQuote(id, user.id);
        setQuotes((prev) =>
          prev.map((q) => (q.id === id ? { ...q, ...updated } : q))
        );
      } catch (e) {
        console.error("Failed to assign user to quote", e);
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  quoted_user: previousQuotedUser as Quote["quoted_user"],
                  quoted_name: previousQuotedName,
                }
              : q
          )
        );
        throw e;
      }
    },
    []
  );

  const refreshQuotes = useCallback(async () => {
    await loadQuotes(true);
  }, [loadQuotes]);

  const removeQuotesInvolvingUser = useCallback((userId: number) => {
    setQuotes((prev) =>
      prev.filter(
        (q) => q.author.id !== userId && q.quoted_user?.id !== userId
      )
    );
  }, []);

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
    updateQuoteById,
    assignUserToQuoteById,
    removeQuotesInvolvingUser,
  };
}
