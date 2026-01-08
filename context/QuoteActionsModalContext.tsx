import { Quote } from '@/types/api';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useState } from 'react';

type QuoteActionsModalContextType = {
  selectedQuote: Quote | null;
  openModal: (quote: Quote) => void;
  closeModal: () => void;
  isOpen: boolean;
};

const QuoteActionsModalContext = createContext<QuoteActionsModalContextType | undefined>(undefined);

export const QuoteActionsModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const router = useRouter();

  const openModal = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
    router.push('/(app)/(modals)/quote-actions');
  }, [router]);

  const closeModal = useCallback(() => {
    router.back();
    // Clear quote after a small delay to allow navigation to complete
    setTimeout(() => {
      setSelectedQuote(null);
    }, 100);
  }, [router]);

  return (
    <QuoteActionsModalContext.Provider
      value={{
        selectedQuote,
        openModal,
        closeModal,
        isOpen: selectedQuote !== null,
      }}
    >
      {children}
    </QuoteActionsModalContext.Provider>
  );
};

export const useQuoteActionsModal = () => {
  const ctx = useContext(QuoteActionsModalContext);
  if (!ctx) {
    throw new Error('useQuoteActionsModal must be used within QuoteActionsModalProvider');
  }
  return ctx;
};
