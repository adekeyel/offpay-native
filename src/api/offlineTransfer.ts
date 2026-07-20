import { apiFetch } from './client';
import { buildVoucherPayload, signVoucherPayload, generateNonce } from '../auth/deviceKey';
import type { OfflineVoucher } from '../types/api';

export interface SignedVoucher {
  senderId: string;
  receiverId: string;
  amount: number;
  nonce: string;
  timestamp: number;
  signature: string;
}

/**
 * Signs a brand-new offline transfer entirely on-device — no network call
 * here at all, which is the whole point: this works with zero connectivity.
 * The resulting object is exactly what gets encoded into the QR code / sent
 * over Bluetooth or NFC to the receiver's device.
 */
export async function createSignedVoucher(senderId: string, receiverId: string, amount: number): Promise<SignedVoucher> {
  const nonce = generateNonce();
  const timestamp = Date.now();
  const payload = buildVoucherPayload({ senderId, receiverId, amount, nonce, timestamp });
  const signature = await signVoucherPayload(payload);
  return { senderId, receiverId, amount, nonce, timestamp, signature };
}

/** Called by the RECEIVER once it has connectivity, to record an incoming voucher it hasn't seen the sender sync yet. */
export function reportIncomingVoucher(voucher: SignedVoucher, senderDeviceId: string) {
  return apiFetch<{ success: true; data: OfflineVoucher }>('/transfers/offline/incoming', {
    method: 'POST',
    body: { senderId: voucher.senderId, senderDeviceId, amount: voucher.amount, nonce: voucher.nonce, timestamp: voucher.timestamp, signature: voucher.signature },
  });
}

/** Called by the SENDER once it has connectivity, to actually settle a voucher it signed while offline. */
export function syncVoucher(voucher: SignedVoucher, deviceId: string) {
  return apiFetch<{ success: boolean; message: string; data: OfflineVoucher }>('/transfers/offline/voucher', {
    method: 'POST',
    body: { receiverId: voucher.receiverId, amount: voucher.amount, nonce: voucher.nonce, timestamp: voucher.timestamp, signature: voucher.signature, deviceId },
  });
}

export function getOfflineTransferHistory() {
  return apiFetch<{ success: true; data: OfflineVoucher[] }>('/transfers/offline/history', { cacheKey: 'offline-transfer-history' });
}
