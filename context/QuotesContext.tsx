// context/QuotesContext.tsx
import { QuotesFeedValue, useQuotesFeed } from "@/hooks/useQuotesFeed";
import { createContext, useContext } from "react";

const QuotesContext = createContext<QuotesFeedValue | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // main/global feed -> no scope
  const feed = useQuotesFeed({ scope: null });

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
