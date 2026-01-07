// hooks/useSavedQuotesFeed.tsx
import { getSavedQuotes } from "@/lib/api/quotes";
import { useQuotesFeed } from "./useQuotesFeed";
import { useMemo } from "react";
import { Quote } from "@/types/api";

export const useSavedQuotesFeed = () => {
  const feed = useQuotesFeed({
    fetcher: (url) => getSavedQuotes(url ?? null),
  });

  // Filter out quotes that are no longer saved (after unsaving)
  // This ensures the saved quotes list only shows actually saved quotes
  const savedQuotes = useMemo(() => {
    return feed.quotes.filter((q: Quote) => q.is_saved);
  }, [feed.quotes]);

  // Override unsaveQuoteById to remove quotes from the list
  // The base hook marks them as unsaved, so we filter them out
  const unsaveQuoteById = async (id: number) => {
    await feed.unsaveQuoteById(id);
    // The quote is now marked as unsaved, so it will be filtered out by savedQuotes
  };

  return {
    ...feed,
    quotes: savedQuotes,
    unsaveQuoteById,
  };
};

