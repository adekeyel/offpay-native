import { apiFetch } from './client';
import type { SupportTicket } from '../types/api';

export function createTicket(subject: string, message: string) {
  return apiFetch<{ success: true; data: SupportTicket }>('/support', {
    method: 'POST', body: { subject, message },
  });
}

export function myTickets() {
  return apiFetch<{ success: true; data: SupportTicket[] }>('/support/mine');
}
