import { Quote, PaginatedQuoteList } from '../../types/api';
import api from './client';

export type FeedScope =
  | { type: 'user'; id: number };

/**
 * Fetch feed items. When a full pagination URL is provided, it is used as-is.
 * Otherwise, construct the endpoint based on the optional scope.
 */
export const getQuotes = async (
  url?: string | null,
  scope?: FeedScope | null
): Promise<PaginatedQuoteList> => {
  let endpoint: string;

  if (url) {
    endpoint = url;
  } else if (scope) {
    endpoint = `/quotes/user/${scope.id}/`;
  } else {
    endpoint = '/quotes/';
  }

  const res = await api.get<PaginatedQuoteList>(endpoint);
  return res.data;
};

export const createQuote = async (quoteData: Partial<Quote>): Promise<Quote> => {
  const res = await api.post<Quote>('/quotes/', quoteData);
  return res.data;
};

export const getQuote = async (quoteId: number): Promise<Quote> => {
  const res = await api.get<Quote>(`/quotes/${quoteId}/`);
  return res.data;
};

export const updateQuote = async (quoteId: number, updates: Partial<Quote>): Promise<Quote> => {
  const res = await api.put<Quote>(`/quotes/${quoteId}/`, updates);
  return res.data;
};

export const deleteQuote = async (quoteId: number): Promise<void> => {
  await api.delete(`/quotes/${quoteId}/`);
};

export const witnessQuote = async (quoteId: number) => {
  const res = await api.post(`/quotes/${quoteId}/witness/`);
  return res.data;
};

export const likeQuote = async (quoteId: number) => {
  const res = await api.post(`/quotes/${quoteId}/like/`);
  return res.data;
};

export const guessQuote = async (
  quoteId: number,
  guessedUserId?: number,
  skipped = false
) => {
  const res = await api.post<{ id: number; user: number; quote: number; guessed_user?: number | null; correct: boolean | null; skipped: boolean; created_at: string }>(
    `/guesses/create/`,
    {
      quote: quoteId,
      guessed_user: guessedUserId ?? null,
      skipped,
    }
  );
  return res.data;
};
