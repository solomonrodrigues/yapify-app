// context/QuotesContext.tsx
import { QuotesFeedValue, useQuotesFeed } from "@/hooks/useQuotesFeed";
import { getGuessableQuotes, getQuotes, getRespondableQuotes } from "@/lib/api/quotes";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useFeedFilter, FeedFilterType } from "./FeedFilterContext";
import { useGroups } from "./GroupsContext";

const QuotesContext = createContext<QuotesFeedValue | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { filter } = useFeedFilter();
  const { currentGroup } = useGroups();
  const prevFilterRef = useRef<FeedFilterType>(filter);
  const prevGroupIdRef = useRef<number | null | undefined>(currentGroup?.id);

  const fetcher = useCallback(
    async (url?: string | null) => {
      switch (filter) {
        case 'guessable':
          return getGuessableQuotes(url);
        case 'respondable':
          return getRespondableQuotes(url);
        case 'latest':
        default:
          return getQuotes(url, null, currentGroup?.id);
      }
    },
    [filter, currentGroup?.id]
  );

  const feed = useQuotesFeed({ scope: null, fetcher });

  // Reload when filter or active group changes
  useEffect(() => {
    const filterChanged = prevFilterRef.current !== filter;
    const groupChanged = prevGroupIdRef.current !== currentGroup?.id;
    if (filterChanged || groupChanged) {
      prevFilterRef.current = filter;
      prevGroupIdRef.current = currentGroup?.id;
      feed.loadQuotes(true);
    }
  }, [filter, currentGroup?.id, feed.loadQuotes]);

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
