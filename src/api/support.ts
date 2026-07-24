import { apiFetch } from './client';
import type { SupportTicket, SupportReply } from '../types/api';

export interface SupportTopic {
  id: string;
  icon: string;
  label: string;
  prefill_subject: string | null;
  prefill_message: string | null;
}

export interface SupportFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export function createTicket(subject: string, message: string) {
  return apiFetch<{ success: true; data: SupportTicket }>('/support', {
    method: 'POST', body: { subject, message },
  });
}

export function myTickets() {
  return apiFetch<{ success: true; data: SupportTicket[] }>('/support/mine');
}

export function getTopics() {
  return apiFetch<{ success: true; data: SupportTopic[] }>('/support/topics', { cacheKey: 'support-topics' });
}

/** FAQs grouped by category, e.g. { "Hot Issues": [...], "Transaction": [...] } — matches how the FAQ tabs render. */
export function getFaqs() {
  return apiFetch<{ success: true; data: Record<string, SupportFaq[]> }>('/support/faqs', { cacheKey: 'support-faqs' });
}

/** Full conversation for one ticket, including every admin/user reply — this is what was missing before. */
export function getTicketThread(id: string) {
  return apiFetch<{ success: true; data: { ticket: SupportTicket; replies: SupportReply[] } }>(`/support/${id}`);
}

export function replyToTicket(id: string, message: string) {
  return apiFetch<{ success: true; message: string }>(`/support/${id}/reply`, {
    method: 'POST', body: { message },
  });
}
