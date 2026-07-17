import 'react-native-get-random-values';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { getDevicePrivateKey, setDevicePrivateKey } from './secureStorage';

// Enables the synchronous ed.sign/verify/getPublicKey methods — without
// this, only the *Async variants work. Must run once, before any signing.
ed.hashes.sha512 = sha512;
ed.hashes.sha512Async = (m: Uint8Array) => Promise.resolve(sha512(m));

function toBase64(bytes: Uint8Array): string {
  // Modern RN/Hermes (0.72+) provides btoa/atob globally — no extra dependency needed.
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

/**
 * Returns this device's Ed25519 keypair, generating and persisting one on
 * first use. The private key never leaves the device (SecureStore only) —
 * only the public key is ever sent to the backend, via POST /devices/key.
 */
export async function getOrCreateKeypair(): Promise<{ privateKeyB64: string; publicKeyB64: string }> {
  const existing = await getDevicePrivateKey();
  if (existing) {
    const privateKeyBytes = fromBase64(existing);
    const publicKeyBytes = ed.getPublicKey(privateKeyBytes);
    return { privateKeyB64: existing, publicKeyB64: toBase64(publicKeyBytes) };
  }

  const secretKey = ed.utils.randomSecretKey();
  const publicKey = ed.getPublicKey(secretKey);
  const privateKeyB64 = toBase64(secretKey);
  await setDevicePrivateKey(privateKeyB64);
  return { privateKeyB64, publicKeyB64: toBase64(publicKey) };
}

/**
 * Builds the exact canonical string the backend re-verifies against — must
 * match src/utils/voucherCrypto.js's buildVoucherPayload on the backend
 * byte-for-byte, or every signature will fail verification.
 */
export function buildVoucherPayload(params: {
  senderId: string;
  receiverId: string;
  amount: number;
  nonce: string;
  timestamp: number;
}): string {
  return `${params.senderId}|${params.receiverId}|${params.amount.toFixed(2)}|${params.nonce}|${params.timestamp}`;
}

/** Signs a voucher payload with this device's private key — the core of the whole offline-transfer flow. */
export async function signVoucherPayload(payload: string): Promise<string> {
  const privateKeyB64 = await getDevicePrivateKey();
  if (!privateKeyB64) throw new Error('No device signing key found — call getOrCreateKeypair() first.');
  const privateKeyBytes = fromBase64(privateKeyB64);
  const message = new TextEncoder().encode(payload);
  const signature = ed.sign(message, privateKeyBytes);
  return toBase64(signature);
}

/** Generates a fresh random nonce for a new voucher — prevents the same voucher ever being replayed/double-processed. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  // eslint-disable-next-line no-undef
  crypto.getRandomValues(bytes); // polyfilled by react-native-get-random-values, imported at the top of this file
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
