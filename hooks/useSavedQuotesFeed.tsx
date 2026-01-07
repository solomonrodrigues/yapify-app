// hooks/useSavedQuotesFeed.tsx
import { getSavedQuotes } from "@/lib/api/quotes";
import { useQuotesFeed } from "./useQuotesFeed";

export const useSavedQuotesFeed = () => {
  return useQuotesFeed({
    fetcher: (url) => getSavedQuotes(url ?? null),
  });
};

