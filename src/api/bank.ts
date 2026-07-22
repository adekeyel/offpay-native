import { apiFetch } from './client';

export interface Bank {
  id: string;
  name: string;
  code: string;
  country: string;
}

export function listBanks() {
  return apiFetch<{ success: true; data: Bank[]; warning?: string }>('/banks');
}

export function resolveExternalAccount(accountNumber: string, bankCode: string) {
  return apiFetch<{ success: true; data: { accountName: string; accountNumber: string } }>('/wallet/resolve-external-account', {
    method: 'POST', body: { accountNumber, bankCode },
  });
}

export function transferToBank(params: { accountNumber: string; bankCode: string; bankName: string; amount: number; narration?: string; pin: string; otpCode?: string }) {
  return apiFetch<{ success: true; message: string; data: any }>('/wallet/transfer-to-bank', {
    method: 'POST', body: params,
  });
}
