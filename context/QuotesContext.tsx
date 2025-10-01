import React, { createContext, useContext, useState, useCallback } from 'react';
import { Quote } from '@/types/api';
import { getQuotes, guessQuote, likeQuote, witnessQuote } from '@/api/quotes';
import { getErrorMessage } from '@/utils/error';

interface QuotesContextValue {
  quotes: Quote[];
  initialLoading: boolean;
  refreshing: boolean;
  error: string | null;
  hasLoadedOnce: boolean;
  loadQuotes: (isRefresh?: boolean) => Promise<void>;
  refreshQuotes: () => Promise<void>;
  likeQuoteById: (id: number) => Promise<void>;
  witnessQuoteById: (id: number) => Promise<void>;
  guessQuoteById: (id: number, guessedUserId?: number, skipped?: boolean) => Promise<void>;
}

const QuotesContext = createContext<QuotesContextValue | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadQuotes = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (!hasLoadedOnce) {
      setInitialLoading(true);
    }

    try {
      const data = await getQuotes();
      setQuotes(data);
      setError(null);
      setHasLoadedOnce(true);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setInitialLoading(false);
      }
    }
  }, [hasLoadedOnce]);

  const likeQuoteById = async (id: number) => {
    setQuotes(prev =>
      prev.map(q => {
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
      await likeQuote(id); // should toggle user’s like in DB
    } catch (e) {
      console.error(e);
      // rollback on failure
      setQuotes(prev =>
        prev.map(q =>
          q.id === id
            ? { ...q, is_liked: !q.is_liked, like_count: q.like_count + (q.is_liked ? -1 : 1) }
            : q
        )
      );
    }
  };

  const witnessQuoteById = async (id: number) => {
    try {
      await witnessQuote(id, true, '');
      loadQuotes(true);
    } catch (e) {
      console.error(e);
    }
  };

  const guessQuoteById = async (id: number, guessedUserId?: number, skipped = false) => {
    // Optimistic UI: immediately mark as guessed
    setQuotes(prev =>
      prev.map(q =>
        q.id !== id
          ? q
          : {
              ...q,
              has_guessed: true,
              guess: {
                id: -1, // temporary placeholder
                user: 0,
                quote: q.id,
                guessed_user: guessedUserId ?? null,
                correct: null,
                skipped: skipped,
                created_at: new Date().toISOString(),
              },
              remaining_skips: q.remaining_skips - (skipped ? 1 : 0),
            }
      )
    );

    try {
      const result = await guessQuote(id, guessedUserId, skipped);
      setQuotes(prev =>
        prev.map(q => (q.id === id ? { ...q, guess: result, has_guessed: true } : q))
      );
    } catch (e: any) {
      console.error("Failed to submit guess", e);
      setQuotes(prev =>
        prev.map(q =>
          q.id === id
            ? { ...q, has_guessed: false, guess: null, remaining_skips: q.remaining_skips + (skipped ? 1 : 0) }
            : q
        )
      );
      // optionally show user an alert if ValidationError (skip limit exceeded)
      if (e.response?.data?.detail) alert(e.response.data.detail);
    }
  };


  return (
    <QuotesContext.Provider value={{ 
      quotes, 
      initialLoading, 
      refreshing,
      error,
      hasLoadedOnce,
      loadQuotes,
      refreshQuotes: () => loadQuotes(true), 
      likeQuoteById, 
      witnessQuoteById,
      guessQuoteById
    }}>
      {children}
    </QuotesContext.Provider>
  );
};

export const useQuotes = () => {
  const ctx = useContext(QuotesContext);
  if (!ctx) throw new Error('useQuotes must be used within QuotesProvider');
  return ctx;
};
