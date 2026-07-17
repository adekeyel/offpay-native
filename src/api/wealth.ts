import { apiFetch } from './client';
import type { WealthProduct, WealthAccount } from '../types/api';

export function getWealthProducts() {
  return apiFetch<{ success: true; data: WealthProduct[] }>('/wealth/products');
}

export function getMyWealthAccounts() {
  return apiFetch<{ success: true; data: WealthAccount[] }>('/wealth/accounts');
}

export function openWealthAccount(params: {
  wealthProductId: string; amount?: number; targetAmount?: number; targetDate?: string; tenorDays?: number;
}) {
  return apiFetch<{ success: true; data: WealthAccount }>('/wealth/accounts', { method: 'POST', body: params });
}

export function depositToWealthAccount(accountId: string, amount: number) {
  return apiFetch<{ success: true; data: WealthAccount }>(`/wealth/accounts/${accountId}/deposit`, {
    method: 'POST', body: { amount },
  });
}

export function withdrawFromWealthAccount(accountId: string, amount: number) {
  return apiFetch<{ success: true; data: WealthAccount }>(`/wealth/accounts/${accountId}/withdraw`, {
    method: 'POST', body: { amount },
  });
}
