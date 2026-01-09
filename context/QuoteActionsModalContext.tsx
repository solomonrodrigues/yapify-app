import { Quote } from '@/types/api';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useState } from 'react';

type QuoteActionsModalContextType = {
  selectedQuoteId: number | null;
  selectedQuote: Quote | null;
  openModal: (quote: Quote) => void;
  closeModal: () => void;
  isOpen: boolean;
};

const QuoteActionsModalContext = createContext<QuoteActionsModalContextType | undefined>(undefined);

export const QuoteActionsModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const router = useRouter();

  const openModal = useCallback((quote: Quote) => {
    setSelectedQuoteId(quote.id);
    setSelectedQuote(quote);
    // Navigate to modal - works from any screen in the app
    try {
      router.push({
        pathname: '/(app)/(modals)/quote-actions',
      });
    } catch (error) {
      console.error('Error opening quote actions modal:', error);
    }
  }, [router]);

  const closeModal = useCallback(() => {
    router.back();
    // Clear quote after a small delay to allow navigation to complete
    setTimeout(() => {
      setSelectedQuoteId(null);
      setSelectedQuote(null);
    }, 100);
  }, [router]);

  return (
    <QuoteActionsModalContext.Provider
      value={{
        selectedQuoteId,
        selectedQuote,
        openModal,
        closeModal,
        isOpen: selectedQuoteId !== null,
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
