import api from './client';
import { Quote } from '../types/api';

export const getQuotes = async (): Promise<Quote[]> => {
  const res = await api.get<{ results: Quote[] }>('/quotes/');
  return res.data.results || [];
};


export const createQuote = async (quoteData: Partial<Quote>): Promise<Quote> => {
  const res = await api.post<Quote>('/quotes/', quoteData);
  return res.data;
};

export const updateQuote = async (quoteId: number, updates: Partial<Quote>): Promise<Quote> => {
  const res = await api.put<Quote>(`/quotes/${quoteId}/`, updates);
  return res.data;
};

export const deleteQuote = async (quoteId: number): Promise<void> => {
  await api.delete(`/quotes/${quoteId}/`);
};

export const witnessQuote = async (quoteId: number, isWitness: boolean, comment: string) => {
  const res = await api.post(`/quotes/${quoteId}/witness/`, { is_witness: isWitness, comment });
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
