import { apiFetch, API_URL } from './client';
import type { WalletSummary, Transaction, VtuProduct, Card } from '../types/api';

export function getWalletSummary() {
  return apiFetch<{ success: true; data: WalletSummary }>('/wallet/summary', { cacheKey: 'wallet-summary' });
}

export function resolveWallet(walletId: string) {
  return apiFetch<{ success: true; data: { userId: string; walletId: string; accountNumber: string; accountName: string } }>(
    `/wallet/resolve?walletId=${encodeURIComponent(walletId)}`
  );
}

/**
 * Sends money instantly to another OffPay user's wallet, online — no QR
 * code or physical proximity needed (that's the offline flow in
 * api/offlineTransfer.ts). Settles immediately server-side since both
 * wallets live in the same database, unlike a bank payout.
 */
export function sendToWallet(params: { recipientWalletId: string; amount: number; narration?: string; pin: string; otpCode?: string }) {
  return apiFetch<{ success: true; message: string; data: { reference: string; fee: number; amount: number } }>(
    '/transactions/send-in-app',
    { method: 'POST', body: params }
  );
}

export interface OfflineTokenResult {
  offlineTokenId: string;
  token: string;
  balanceSnapshot: number;
  offlineLimit: number;
  lockedAmount: number;
  lockPercent: number;
  availablePercent: number;
  expiresAt: string;
}

/**
 * Call this while the device still has connectivity, before going offline —
 * it fetches a fresh spending-cap token from the server (see wallet.service.js
 * on the backend) and MUST have been called at least once, with a
 * still-unexpired result, before any offline voucher can successfully sync.
 * Without it, the server has nothing to check the 60/40 lock against and
 * will reject the voucher outright.
 */
export function prepareOfflineMode() {
  return apiFetch<{ success: true; message: string; data: OfflineTokenResult }>('/wallet/offline-token', { method: 'POST' });
}

export function getTransactionHistory(limit = 50) {
  return apiFetch<{ success: true; data: Transaction[] }>(`/transactions?limit=${limit}`, { cacheKey: `transactions-${limit}` });
}

export function downloadStatementUrl() {
  // Returned as a URL for the app to open in-browser / share, since PDF
  // binary download needs a slightly different fetch (blob) handling —
  // see StatementScreen for the actual download implementation.
  return `${API_URL}/transactions/statement/download`;
}

export function receiptUrl(transactionId: string) {
  // Same idea as downloadStatementUrl, but for a single transaction's
  // receipt — see TransactionDetailScreen for the download/share implementation.
  return `${API_URL}/transactions/${transactionId}/receipt`;
}

export function getVtuProducts(category: 'airtime' | 'data' | 'cable' | 'electricity') {
  return apiFetch<{ success: true; data: { providers: string[]; plans: VtuProduct[] } }>(`/vtu/products/${category}`);
}

export function purchaseVtu(params: { category: string; provider: string; recipient: string; amount?: number; productId?: string }) {
  return apiFetch<{ success: true; message: string; data: any }>('/vtu/purchase', { method: 'POST', body: params });
}

export function getMyCard() {
  return apiFetch<{ success: true; data: Card | null }>('/cards/mine', { cacheKey: 'my-card' });
}

export function createCard() {
  return apiFetch<{ success: true; data: Card }>('/cards', { method: 'POST' });
}

export function updateCardStatus(cardId: string, action: 'freeze' | 'unfreeze' | 'block') {
  return apiFetch<{ success: true; data: Card }>(`/cards/${cardId}/status`, { method: 'POST', body: { action } });
}

export function deleteCard(cardId: string) {
  return apiFetch<{ success: true; message: string }>(`/cards/${cardId}`, { method: 'DELETE' });
}

export function registerDeviceKey(deviceId: string, publicKey: string, platform: 'ios' | 'android') {
  return apiFetch<{ success: true }>('/devices/key', { method: 'POST', body: { deviceId, publicKey, platform } });
}

export function registerPushToken(deviceId: string, expoPushToken: string, platform: 'ios' | 'android') {
  return apiFetch<{ success: true }>('/devices/push-token', { method: 'POST', body: { deviceId, expoPushToken, platform } });
}
