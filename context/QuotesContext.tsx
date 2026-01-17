// context/QuotesContext.tsx
import { QuotesFeedValue, useQuotesFeed } from "@/hooks/useQuotesFeed";
import { getGuessableQuotes, getQuotes, getRespondableQuotes } from "@/lib/api/quotes";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useFeedFilter, FeedFilterType } from "./FeedFilterContext";

const QuotesContext = createContext<QuotesFeedValue | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { filter } = useFeedFilter();
  const prevFilterRef = useRef<FeedFilterType>(filter);

  // Create a fetcher that uses the appropriate API based on the filter
  const fetcher = useCallback(
    async (url?: string | null) => {
      switch (filter) {
        case 'guessable':
          return getGuessableQuotes(url);
        case 'respondable':
          return getRespondableQuotes(url);
        case 'latest':
        default:
          return getQuotes(url);
      }
    },
    [filter]
  );

  const feed = useQuotesFeed({ scope: null, fetcher });

  // Reload quotes when filter changes
  useEffect(() => {
    if (prevFilterRef.current !== filter) {
      prevFilterRef.current = filter;
      feed.loadQuotes(true);
    }
  }, [filter, feed.loadQuotes]);

  return (
    <QuotesContext.Provider value={feed}>
      {children}
    </QuotesContext.Provider>
  );
};

export const useQuotes = () => {
  const ctx = useContext(QuotesContext);
  if (!ctx) throw new Error("useQuotes must be used within QuotesProvider");
  return ctx;
};
