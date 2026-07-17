import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SignedVoucher } from '../api/offlineTransfer';

const OUTBOX_KEY = 'offpay_offline_voucher_outbox';

export interface OutboxEntry {
  voucher: SignedVoucher;
  deviceId: string;
  receiverName?: string;
  createdAt: number;
}

export async function getOutbox(): Promise<OutboxEntry[]> {
  const raw = await AsyncStorage.getItem(OUTBOX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addToOutbox(entry: OutboxEntry): Promise<void> {
  const current = await getOutbox();
  current.push(entry);
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(current));
}

export async function removeFromOutbox(nonce: string): Promise<void> {
  const current = await getOutbox();
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(current.filter((e) => e.voucher.nonce !== nonce)));
}
