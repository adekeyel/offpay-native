import * as SecureStore from 'expo-secure-store';
import type { User } from '../types/api';

/**
 * Everything in here is stored via expo-secure-store, which uses the iOS
 * Keychain / Android Keystore — never plain AsyncStorage. This now also
 * holds the locally-verifiable PIN records (salted/hashed, never the raw
 * PIN) that let the app-lock PIN and transaction PIN be checked entirely on
 * -device, with no network round trip — see ../auth/localAuth.ts for the
 * hashing itself. That's what makes Unlock and "authorize with PIN" work
 * with zero connectivity, which is the whole point of an offline-first
 * wallet app.
 */
const KEYS = {
  refreshToken: 'offpay_refresh_token',
  devicePrivateKey: 'offpay_device_private_key',
  deviceId: 'offpay_device_id',
  offlineTokenCache: 'offpay_offline_token_cache',
  cachedUser: 'offpay_cached_user',
  lockPinRecord: 'offpay_lock_pin_record',
  txnPinRecord: 'offpay_txn_pin_record',
  lockPinAttempts: 'offpay_lock_pin_attempts',
  txnPinAttempts: 'offpay_txn_pin_attempts',
} as const;

export type PinKind = 'lock' | 'transaction';

export interface LocalPinRecord {
  saltB64: string;
  hashB64: string;
  iterations: number;
}

export interface PinAttemptState {
  failedCount: number;
  lockedUntil: number | null; // epoch ms
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(KEYS.refreshToken, token);
  else await SecureStore.deleteItemAsync(KEYS.refreshToken);
}

export async function getDevicePrivateKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.devicePrivateKey);
}

export async function setDevicePrivateKey(base64Key: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.devicePrivateKey, base64Key);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEYS.deviceId);
  if (existing) return existing;
  const fresh = `device-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  await SecureStore.setItemAsync(KEYS.deviceId, fresh);
  return fresh;
}

/**
 * Caches the most recent offline spending-cap token (see wallet.ts's
 * prepareOfflineMode) so it survives the app being backgrounded or losing
 * connectivity after it was fetched — otherwise a device that goes offline
 * before opening the Send screen again would have no token to authorize
 * against, even though it successfully prepared one earlier.
 */
export async function getCachedOfflineToken(): Promise<{ token: string; offlineLimit: number; expiresAt: string } | null> {
  const raw = await SecureStore.getItemAsync(KEYS.offlineTokenCache);
  return raw ? JSON.parse(raw) : null;
}

export async function setCachedOfflineToken(data: { token: string; offlineLimit: number; expiresAt: string } | null): Promise<void> {
  if (data) await SecureStore.setItemAsync(KEYS.offlineTokenCache, JSON.stringify(data));
  else await SecureStore.deleteItemAsync(KEYS.offlineTokenCache);
}

/**
 * A snapshot of the last known-good `User` object, refreshed on every
 * successful login/unlock while online. Lets Unlock populate the session
 * immediately after a correct PIN even with zero connectivity — the app
 * doesn't need a fresh server response just to know who you are and show
 * your name; wallet/transaction data still loads (or fails gracefully) from
 * their own screens the normal way.
 */
export async function getCachedUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(KEYS.cachedUser);
  return raw ? JSON.parse(raw) : null;
}

export async function setCachedUser(user: User | null): Promise<void> {
  if (user) await SecureStore.setItemAsync(KEYS.cachedUser, JSON.stringify(user));
  else await SecureStore.deleteItemAsync(KEYS.cachedUser);
}

function recordKey(kind: PinKind) {
  return kind === 'lock' ? KEYS.lockPinRecord : KEYS.txnPinRecord;
}

export async function getLocalPinRecord(kind: PinKind): Promise<LocalPinRecord | null> {
  const raw = await SecureStore.getItemAsync(recordKey(kind));
  return raw ? JSON.parse(raw) : null;
}

export async function setLocalPinRecord(kind: PinKind, record: LocalPinRecord | null): Promise<void> {
  if (record) await SecureStore.setItemAsync(recordKey(kind), JSON.stringify(record));
  else await SecureStore.deleteItemAsync(recordKey(kind));
}

function attemptsKey(kind: PinKind) {
  return kind === 'lock' ? KEYS.lockPinAttempts : KEYS.txnPinAttempts;
}

export async function getPinAttemptState(kind: PinKind): Promise<PinAttemptState> {
  const raw = await SecureStore.getItemAsync(attemptsKey(kind));
  return raw ? JSON.parse(raw) : { failedCount: 0, lockedUntil: null };
}

export async function setPinAttemptState(kind: PinKind, state: PinAttemptState): Promise<void> {
  await SecureStore.setItemAsync(attemptsKey(kind), JSON.stringify(state));
}

/** Called on explicit logout — clears session + cached identity, but deliberately NOT the device keypair or local PIN records (see clearAll below for why). */
export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.refreshToken);
  await SecureStore.deleteItemAsync(KEYS.cachedUser);
}

/**
 * Full wipe, including the device signing key and local PIN records. Only
 * call this for a genuine "remove this account from this device" action —
 * not a normal logout — since it invalidates this device's ability to sign
 * vouchers as this user (a new keypair would need registering again via
 * POST /devices/key) and forces PINs to be re-set next time this user signs
 * in on this device.
 */
export async function clearAll(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.refreshToken);
  await SecureStore.deleteItemAsync(KEYS.devicePrivateKey);
  await SecureStore.deleteItemAsync(KEYS.cachedUser);
  await SecureStore.deleteItemAsync(KEYS.lockPinRecord);
  await SecureStore.deleteItemAsync(KEYS.txnPinRecord);
  await SecureStore.deleteItemAsync(KEYS.lockPinAttempts);
  await SecureStore.deleteItemAsync(KEYS.txnPinAttempts);
}
