import * as SecureStore from 'expo-secure-store';

/**
 * Everything in here is stored via expo-secure-store, which uses the iOS
 * Keychain / Android Keystore — never plain AsyncStorage. The two things
 * that live here (refresh token, device Ed25519 private key) are exactly
 * the two things that must never leak: the refresh token is a 180-day
 * bearer credential, and the private key is what proves this device's
 * identity when signing offline transfer vouchers — if either leaked from
 * disk, that would be a real compromise, not just an inconvenience.
 */
const KEYS = {
  refreshToken: 'offpay_refresh_token',
  devicePrivateKey: 'offpay_device_private_key',
  deviceId: 'offpay_device_id',
  offlineTokenCache: 'offpay_offline_token_cache',
} as const;

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

/** Called on explicit logout — clears everything session-related, but deliberately NOT the device keypair (see clearAll below for why). */
export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.refreshToken);
}

/**
 * Full wipe, including the device signing key. Only call this for a genuine
 * "remove this account from this device" action — not a normal logout —
 * since it invalidates this device's ability to sign vouchers as this user
 * (a new keypair would need registering again via POST /devices/key).
 */
export async function clearAll(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.refreshToken);
  await SecureStore.deleteItemAsync(KEYS.devicePrivateKey);
}
