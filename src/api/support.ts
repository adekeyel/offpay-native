import { apiFetch } from './client';
import type { SupportTicket, SupportReply } from '../types/api';

export function createTicket(subject: string, message: string) {
  return apiFetch<{ success: true; data: SupportTicket }>('/support', {
    method: 'POST', body: { subject, message },
  });
}

export function myTickets() {
  return apiFetch<{ success: true; data: SupportTicket[] }>('/support/mine');
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
