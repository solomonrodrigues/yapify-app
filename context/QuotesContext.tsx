import React, { createContext, useContext, useState, useEffect } from 'react';
import { Quote } from '@/types/api';
import { getQuotes, likeQuote, witnessQuote } from '@/api/quotes';
import { useAuth } from '@/context/AuthContext';

interface QuotesContextValue {
  quotes: Quote[];
  initialLoading: boolean; // first fetch only
  refreshing: boolean;     // subsequent refreshes
  refreshQuotes: () => Promise<void>;
  likeQuoteById: (id: number) => Promise<void>;
  witnessQuoteById: (id: number) => Promise<void>;
}

const QuotesContext = createContext<QuotesContextValue | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const fetchQuotes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setInitialLoading(true);

    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch (error) {
      console.error('Failed to load quotes', error);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setInitialLoading(false);
    }
  };

  const likeQuoteById = async (id: number) => {
    setQuotes(prev =>
      prev.map(q =>
        q.id === id
          ? {
              ...q,
              is_liked: q.is_liked === 'true' ? 'false' : 'true',
              like_count: (Number(q.like_count) + (q.is_liked === 'true' ? -1 : 1)).toString()
            }
          : q
      )
    );
    try {
      await likeQuote(id);
    } catch (e) {
      console.error(e);
    }
  };

  const witnessQuoteById = async (id: number) => {
    try {
      await witnessQuote(id, true, '');
      fetchQuotes(true); // refresh
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Only fetch quotes when authenticated and auth check is complete
    if (isLoggedIn && !authLoading) {
      fetchQuotes(); // initial fetch
    }
  }, [isLoggedIn, authLoading]);

  return (
    <QuotesContext.Provider value={{ quotes, initialLoading, refreshing, refreshQuotes: () => fetchQuotes(true), likeQuoteById, witnessQuoteById }}>
      {children}
    </QuotesContext.Provider>
  );
};

export const useQuotes = () => {
  const ctx = useContext(QuotesContext);
  if (!ctx) throw new Error('useQuotes must be used within QuotesProvider');
  return ctx;
};
