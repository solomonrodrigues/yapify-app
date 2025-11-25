// hooks/useUserQuotesFeed.tsx
import { useQuotesFeed } from "./useQuotesFeed";

export const useUserQuotesFeed = (userId: number) => {
    return useQuotesFeed({ scope: { type: "user", id: userId } });
};
