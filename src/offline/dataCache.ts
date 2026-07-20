import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'offpay_data_cache:';

export interface CacheEnvelope<T> {
  json: T;
  cachedAt: number;
}

export async function readCache<T = any>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

export async function writeCache<T = any>(key: string, json: T): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = { json, cachedAt: Date.now() };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // Best-effort — if AsyncStorage is full or unavailable, the app still
    // works, it just won't have offline data for this key next time.
  }
}

/**
 * Mutates an already-cached response in place with an updater function, e.g.
 * to reflect an offline spend on the wallet summary immediately rather than
 * waiting for the next successful network fetch. No-ops if nothing is
 * cached yet for that key (nothing to optimistically update).
 */
export async function patchCache<T = any>(key: string, updater: (current: T) => T): Promise<void> {
  const existing = await readCache<T>(key);
  if (!existing) return;
  await writeCache(key, updater(existing.json));
}
