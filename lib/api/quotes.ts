import { Quote, PaginatedQuoteList } from '../../types/api';
import api from './client';

export type FeedScope =
  | { type: 'user-posted'; id: number }
  | { type: 'user-received'; id: number };

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
    // Use the appropriate endpoint based on scope type
    if (scope.type === 'user-posted') {
      endpoint = `/users/${scope.id}/quotes/posted/`;
    } else if (scope.type === 'user-received') {
      endpoint = `/users/${scope.id}/quotes/received/`;
    } else {
      endpoint = '/quotes/';
    }
  } else {
    endpoint = '/quotes/';
  }

  const res = await api.get<PaginatedQuoteList>(endpoint);
  return res.data;
};

export const searchQuotes = async (
  query: string,
  year?: number,
  month?: number
): Promise<Quote[]> => {
  if (!query.trim()) return [];

  const params: Record<string, any> = { search: query };
  if (year) params.year = year;
  if (month) params.month = month;

  const res = await api.get<{ results: Quote[] }>("/quotes/search/", { params });
  return res.data.results || [];
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

export const saveQuote = async (quoteId: number) => {
  const res = await api.post(`/quotes/${quoteId}/save/`);
  return res.data;
};

export const unsaveQuote = async (quoteId: number) => {
  const res = await api.delete(`/quotes/${quoteId}/save/`);
  return res.data;
};

export const getSavedQuotes = async (
  url?: string | null,
): Promise<PaginatedQuoteList> => {
  let endpoint: string;

  if (url) {
    endpoint = url;
  } else {
    endpoint = '/quotes/saved/';
  }

  const res = await api.get<PaginatedQuoteList>(endpoint);
  return res.data;
};

export const hideQuote = async (quoteId: number) => {
  const res = await api.post(`/quotes/${quoteId}/hide/`);
  return res.data;
};

export const unhideQuote = async (quoteId: number) => {
  const res = await api.delete(`/quotes/${quoteId}/hide/`);
  return res.data;
};

export const getHiddenQuotes = async (
  url?: string | null,
): Promise<PaginatedQuoteList> => {
  let endpoint: string;

  if (url) {
    endpoint = url;
  } else {
    endpoint = '/quotes/hidden/';
  }

  const res = await api.get<PaginatedQuoteList>(endpoint);
  return res.data;
};

export const getQuoteLikes = async (
  quoteId: number,
  url?: string | null
): Promise<{ results: import('@/types/api').PublicUser[]; next: string | null }> => {
  let endpoint: string;

  if (url) {
    endpoint = url;
  } else {
    endpoint = `/quotes/${quoteId}/likes/`;
  }

  const res = await api.get<{ results: import('@/types/api').PublicUser[]; next: string | null }>(endpoint);
  return res.data;
};

export const getQuoteWitnesses = async (
  quoteId: number,
  url?: string | null
): Promise<{ results: import('@/types/api').PublicUser[]; next: string | null }> => {
  let endpoint: string;

  if (url) {
    endpoint = url;
  } else {
    endpoint = `/quotes/${quoteId}/witnesses/`;
  }

  const res = await api.get<{ results: import('@/types/api').PublicUser[]; next: string | null }>(endpoint);
  return res.data;
};
