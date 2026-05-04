// app/(app)/saved-quotes.tsx
import React from "react";
import { useColorScheme } from "react-native";

import FeedQuote from "@/components/FeedQuote";
import { QuoteListScreen } from "@/components/QuoteListScreen";
import { Colors } from "@/constants/Colors";
import { useSavedQuotesFeed } from "@/hooks/useSavedQuotesFeed";

const SavedQuotesScreen = () => {
  const feed = useSavedQuotesFeed();
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];

  return (
    <QuoteListScreen
      feed={feed}
      loadingText="Loading saved quotes..."
      errorText="Couldn't load saved quotes"
      errorToastLabel="Couldn't load saved quotes"
      emptyText={"No saved quotes yet.\nTap the bookmark on any quote to save your favourites."}
      renderItem={(quote) => (
        <FeedQuote
          quote={quote}
          theme={theme}
          onLike={feed.likeQuoteById}
          onWitness={feed.witnessQuoteById}
          onGuess={feed.guessQuoteById}
          onUnsave={feed.unsaveQuoteById}
          onUnhide={feed.unhideQuoteById}
          onRespond={feed.respondToQuoteById}
        />
      )}
    />
  );
};

export default SavedQuotesScreen;
