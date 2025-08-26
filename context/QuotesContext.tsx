import React, { createContext, useContext, useState, useCallback } from 'react';
import { Quote } from '@/types/api';
import { getQuotes, likeQuote, witnessQuote } from '@/api/quotes';
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
      console.error('Failed to load quotes', error);
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

        const wasLiked = q.is_liked === 'true';
        const newLiked = !wasLiked;

        return {
          ...q,
          is_liked: newLiked ? 'true' : 'false',
          like_count: (Number(q.like_count) + (newLiked ? 1 : -1)).toString(),
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
            ? { ...q, is_liked: q.is_liked === 'true' ? 'false' : 'true' }
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
      witnessQuoteById 
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
