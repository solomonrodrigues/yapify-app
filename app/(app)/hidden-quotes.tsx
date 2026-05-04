// app/(app)/hidden-quotes.tsx
import React from "react";
import { useColorScheme } from "react-native";

import HiddenQuote from "@/components/HiddenQuote";
import { QuoteListScreen } from "@/components/QuoteListScreen";
import { Colors } from "@/constants/Colors";
import { useHiddenQuotesFeed } from "@/hooks/useHiddenQuotesFeed";

const HiddenQuotesScreen = () => {
  const feed = useHiddenQuotesFeed();
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];

  return (
    <QuoteListScreen
      feed={feed}
      loadingText="Loading hidden quotes..."
      errorText="Couldn't load hidden quotes"
      errorToastLabel="Couldn't load hidden quotes"
      emptyText="No hidden quotes."
      renderItem={(quote) => (
        <HiddenQuote quote={quote} theme={theme} onUnhide={feed.unhideQuoteById} />
      )}
    />
  );
};

export default HiddenQuotesScreen;
