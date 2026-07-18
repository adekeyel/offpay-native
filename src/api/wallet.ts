import { apiFetch, API_URL } from './client';
import type { WalletSummary, Transaction, VtuProduct, Card } from '../types/api';

export function getWalletSummary() {
  return apiFetch<{ success: true; data: WalletSummary }>('/wallet/summary');
}

export function resolveWallet(walletId: string) {
  return apiFetch<{ success: true; data: { userId: string; walletId: string; accountNumber: string; accountName: string } }>(
    `/wallet/resolve?walletId=${encodeURIComponent(walletId)}`
  );
}

export function getTransactionHistory(limit = 50) {
  return apiFetch<{ success: true; data: Transaction[] }>(`/transactions?limit=${limit}`);
}

export function downloadStatementUrl() {
  // Returned as a URL for the app to open in-browser / share, since PDF
  // binary download needs a slightly different fetch (blob) handling —
  // see StatementScreen for the actual download implementation.
  return `${API_URL}/transactions/statement/download`;
}

export function getVtuProducts(category: 'airtime' | 'data' | 'cable' | 'electricity') {
  return apiFetch<{ success: true; data: { providers: string[]; plans: VtuProduct[] } }>(`/vtu/products/${category}`);
}

export function purchaseVtu(params: { category: string; provider: string; recipient: string; amount?: number; productId?: string }) {
  return apiFetch<{ success: true; message: string; data: any }>('/vtu/purchase', { method: 'POST', body: params });
}

export function getMyCard() {
  return apiFetch<{ success: true; data: Card | null }>('/cards/mine');
}

export function createCard() {
  return apiFetch<{ success: true; data: Card }>('/cards', { method: 'POST' });
}

export function updateCardStatus(cardId: string, action: 'freeze' | 'unfreeze' | 'block') {
  return apiFetch<{ success: true; data: Card }>(`/cards/${cardId}/status`, { method: 'POST', body: { action } });
}

export function registerDeviceKey(deviceId: string, publicKey: string, platform: 'ios' | 'android') {
  return apiFetch<{ success: true }>('/devices/key', { method: 'POST', body: { deviceId, publicKey, platform } });
}

export function registerPushToken(deviceId: string, expoPushToken: string, platform: 'ios' | 'android') {
  return apiFetch<{ success: true }>('/devices/push-token', { method: 'POST', body: { deviceId, expoPushToken, platform } });
}
