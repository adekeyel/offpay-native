import { patchCache } from './dataCache';
import type { WalletSummary, Transaction } from '../types/api';

type WalletSummaryResponse = { success: true; data: WalletSummary };
type TransactionsResponse = { success: true; data: Transaction[] };

/**
 * Called right after an offline voucher is signed (money committed on this
 * device, before it's ever synced to the server) — reflects the spend in the
 * cached balance immediately, so Home shows the correct number even if the
 * user never regains signal before checking it again. This only touches the
 * local cache; the server remains the source of truth once synced.
 */
export async function applyOptimisticOfflineDebit(amount: number): Promise<void> {
  await patchCache<WalletSummaryResponse>('wallet-summary', (current) => {
    if (!current?.data) return current;
    const data = current.data;
    return {
      ...current,
      data: {
        ...data,
        balance: Math.max(0, data.balance - amount),
        confirmed: Math.max(0, data.confirmed - amount),
        totalIncludingPending: Math.max(0, data.totalIncludingPending - amount),
      },
    };
  });
}

/**
 * Prepends a locally-synthesized "pending" entry to the cached transaction
 * list right after an offline voucher is created, so it shows up in history
 * immediately. It's replaced by the real server record on the next
 * successful transaction-history fetch after syncing.
 */
export async function prependOptimisticTransaction(entry: {
  id: string;
  amount: number;
  narration: string;
  direction: 'debit' | 'credit';
}): Promise<void> {
  const optimistic: Transaction = {
    id: entry.id,
    reference: entry.id,
    type: 'offline_transfer',
    direction: entry.direction,
    amount: entry.amount,
    fee: 0,
    status: 'pending_sync',
    narration: entry.narration,
    created_at: new Date().toISOString(),
  };

  for (const key of ['transactions-50', 'transactions-20', 'transactions-100']) {
    await patchCache<TransactionsResponse>(key, (current) => {
      if (!current?.data) return current;
      return { ...current, data: [optimistic, ...current.data] };
    });
  }
}
