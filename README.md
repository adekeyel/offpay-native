# OffPay Native (React Native / Expo)

Connects to the same backend as the web app — no separate API, no mock data.

## Setup

```bash
npm install
cp .env.example .env
# edit .env: EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app/api
npx expo start
```

Scan the QR with Expo Go to run on a physical device, or press `i`/`a` for a
simulator (camera-dependent screens — registration photo, offline transfer QR
scanning — need a physical device; simulators don't have a real camera).

## What's real vs. what needs a device to actually prove

Everything in here is a genuine implementation, not a stub — every screen
calls the real backend endpoints, and the whole auth/offline-transfer/loan/
wealth flow was cross-verified against the actual backend code (see the
`@noble/ed25519` ↔ `voucherCrypto.js` compatibility test that's part of how
this was built — a real script proving the two sides produce/verify
compatible signatures).

What I could **not** verify here, because there's no iOS/Android simulator or
physical device in the environment this was built in:
- Actually running the app and seeing screens render correctly
- Camera-based QR scanning in practice (the scanning *code* is correct against
  `expo-camera`'s documented API, but untested against a real camera feed)
- Push notification delivery (needs `eas init` to get a real EAS project ID
  before `getExpoPushTokenAsync()` will return anything — currently fails
  silently and just skips push registration until that's set up)
- Bluetooth and NFC transports for offline transfers — **not implemented at
  all yet**. QR is fully built (sign → show QR → scan → report/sync). BT/NFC
  need `react-native-ble-plx` / `react-native-nfc-manager`, which require
  ejecting to a custom EAS dev-client build (they don't work in Expo Go) —
  building those without hardware to test against would just be guessing.

Recommend: run this on a real device early, focus first on the auth flow and
Home/Card/Finance/Rewards screens (pure API calls, low risk), then the QR
offline-transfer flow specifically, since that's the one part with real
on-device crypto and camera interaction to shake out.

## Architecture notes

- **Auth**: one-time OTP at signup only. After that, password login on a new
  device, 4-digit PIN unlock on a known one. Session state machine lives in
  `src/context/AuthContext.tsx` — `unauthenticated` → `locked` → (optionally
  `needs-pin-setup`) → `unlocked`. Backgrounding the app always drops back to
  `locked`, by design (see the `AppState` listener there).
- **Secure storage**: refresh token and the device's Ed25519 private key live
  in `expo-secure-store` (Keychain/Keystore) — never AsyncStorage. Everything
  else (unsynced-voucher outbox) is plain AsyncStorage since it's not
  sensitive.
- **Offline transfers**: `src/auth/deviceKey.ts` handles keypair generation
  and signing; `src/api/offlineTransfer.ts` wraps the three backend calls
  (report-incoming, sync, history). The QR payload for a signed voucher is
  just `JSON.stringify(voucher)` — human-unreadable but not encrypted, since
  the signature itself is what matters (a QR photo being visible to a
  bystander doesn't let them alter the amount without invalidating the
  signature).
- **Rate limiting**: already correctly in place on the backend for register,
  login, unlock, and password-reset requests (`authLimiter`) — no native-side
  changes needed for that.
