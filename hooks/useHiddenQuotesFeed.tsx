// hooks/useHiddenQuotesFeed.tsx
import { useCallback, useState } from "react";

import { getHiddenQuotes, unhideQuote } from "@/lib/api/quotes";
import { getErrorMessage } from "@/lib/utils/error";
import { PaginatedQuoteList, Quote } from "@/types/api";

export interface HiddenQuotesFeedValue {
  quotes: Quote[];
  initialLoading: boolean;
  refreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  hasLoadedOnce: boolean;
  loadQuotes: (isRefresh?: boolean) => Promise<void>;
  refreshQuotes: () => Promise<void>;
  loadMore: () => Promise<void>;
  unhideQuoteById: (id: number) => Promise<void>;
}

export const useHiddenQuotesFeed = (): HiddenQuotesFeedValue => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);

  const loadQuotes = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!hasLoadedOnce) {
        setInitialLoading(true);
      }

      try {
        const data: PaginatedQuoteList = await getHiddenQuotes(null);

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
    [hasLoadedOnce]
  );

  const loadMore = useCallback(
    async () => {
      if (!hasMore || isLoadingMore || !nextPage || refreshing || initialLoading) return;

      setIsLoadingMore(true);
      try {
        const response: PaginatedQuoteList = await getHiddenQuotes(nextPage);
        setQuotes((prev) => [...prev, ...(response.results || [])]);
        setNextPage(response.next ?? null);
        setHasMore(!!response.next);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load more hidden quotes"
        );
      } finally {
        setIsLoadingMore(false);
      }
    },
    [hasMore, isLoadingMore, nextPage, refreshing, initialLoading]
  );

  const unhideQuoteById = useCallback(
    async (id: number) => {
      // Optimistically remove from the hidden list
      const previousQuotes = quotes;
      setQuotes((prev) => prev.filter((q) => q.id !== id));

      try {
        await unhideQuote(id);
      } catch (err) {
        console.error(err);
        // Rollback on failure
        setQuotes(previousQuotes);
        setError(getErrorMessage(err));
      }
    },
    [quotes]
  );

  const refreshQuotes = useCallback(async () => {
    await loadQuotes(true);
  }, [loadQuotes]);

  return {
    quotes,
    initialLoading,
    refreshing,
    isLoadingMore,
    hasMore,
    error,
    hasLoadedOnce,
    loadQuotes,
    refreshQuotes,
    loadMore,
    unhideQuoteById,
  };
};

