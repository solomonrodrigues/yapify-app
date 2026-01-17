import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FeedFilterType = 'latest' | 'guessable' | 'respondable';

export const FEED_FILTER_LABELS: Record<FeedFilterType, string> = {
  latest: 'Latest',
  guessable: 'To Guess',
  respondable: 'To Respond',
};

interface FeedFilterContextType {
  filter: FeedFilterType;
  setFilter: (filter: FeedFilterType) => void;
}

const FeedFilterContext = createContext<FeedFilterContextType | null>(null);

export const FeedFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filter, setFilter] = useState<FeedFilterType>('latest');

  return (
    <FeedFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </FeedFilterContext.Provider>
  );
};

export const useFeedFilter = (): FeedFilterContextType => {
  const context = useContext(FeedFilterContext);
  if (!context) {
    throw new Error('useFeedFilter must be used within a FeedFilterProvider');
  }
  return context;
};
