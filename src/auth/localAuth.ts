import 'react-native-get-random-values';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  getLocalPinRecord, setLocalPinRecord, getPinAttemptState, setPinAttemptState,
} from './secureStorage';
import type { PinKind } from './secureStorage';

// PBKDF2-HMAC-SHA256, pure JS. Runs entirely on-device — no network, no
// server, ever — which is what lets the app-lock PIN and transaction PIN
// both be checked with zero connectivity. 12,000 iterations keeps entry
// feeling instant on real hardware (roughly the same cost budget mobile
// banking apps use for local PIN checks) while still meaningfully slowing
// down anyone trying to brute-force a stolen SecureStore/Keychain dump.
const ITERATIONS = 12000;
const SALT_BYTES = 16;

// A 4-digit PIN only has 10,000 possible values, so the hash strength alone
// isn't enough — this is the second, more important line of defense:
// lock the device's local PIN check out after repeated wrong guesses,
// same as a physical ATM card would.
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
const LOCKOUT_MS = 60_000; // 1 minute, then attempts reset

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomSalt(): Uint8Array {
  const bytes = new Uint8Array(SALT_BYTES);
  // eslint-disable-next-line no-undef
  crypto.getRandomValues(bytes);
  return bytes;
}

function deriveHashB64(pin: string, salt: Uint8Array, iterations: number): string {
  const key = pbkdf2(sha256, new TextEncoder().encode(pin), salt, { c: iterations, dkLen: 32 });
  return toBase64(key);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Persists a salted PBKDF2 hash of `pin` for later fully-offline verification. Call this right after the PIN has been confirmed with the server (or on first offline set — see verifyLocalPin's migration note). */
export async function setLocalPin(kind: PinKind, pin: string): Promise<void> {
  const salt = randomSalt();
  const hashB64 = deriveHashB64(pin, salt, ITERATIONS);
  await setLocalPinRecord(kind, { saltB64: toBase64(salt), hashB64, iterations: ITERATIONS });
  await setPinAttemptState(kind, { failedCount: 0, lockedUntil: null });
}

export async function hasLocalPin(kind: PinKind): Promise<boolean> {
  return (await getLocalPinRecord(kind)) !== null;
}

export async function clearLocalPin(kind: PinKind): Promise<void> {
  await setLocalPinRecord(kind, null);
  await setPinAttemptState(kind, { failedCount: 0, lockedUntil: null });
}

export type PinVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'no-local-pin' }
  | { ok: false; reason: 'locked-out'; retryAt: number }
  | { ok: false; reason: 'wrong-pin'; attemptsRemaining: number };

/**
 * Verifies `pin` against the locally-stored hash — no network call. Tracks
 * failed attempts and enforces a short lockout window after too many wrong
 * guesses, so a lost/stolen unlocked phone can't be PIN-brute-forced.
 */
export async function verifyLocalPin(kind: PinKind, pin: string): Promise<PinVerifyResult> {
  const record = await getLocalPinRecord(kind);
  if (!record) return { ok: false, reason: 'no-local-pin' };

  const attempts = await getPinAttemptState(kind);
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    return { ok: false, reason: 'locked-out', retryAt: attempts.lockedUntil };
  }

  const candidateHash = deriveHashB64(pin, fromBase64(record.saltB64), record.iterations);
  const matches = timingSafeEqual(candidateHash, record.hashB64);

  if (matches) {
    await setPinAttemptState(kind, { failedCount: 0, lockedUntil: null });
    return { ok: true };
  }

  const failedCount = attempts.failedCount + 1;
  const lockedUntil = failedCount >= MAX_ATTEMPTS_BEFORE_LOCKOUT ? Date.now() + LOCKOUT_MS : null;
  await setPinAttemptState(kind, { failedCount: lockedUntil ? 0 : failedCount, lockedUntil });

  if (lockedUntil) return { ok: false, reason: 'locked-out', retryAt: lockedUntil };
  return { ok: false, reason: 'wrong-pin', attemptsRemaining: MAX_ATTEMPTS_BEFORE_LOCKOUT - failedCount };
}
