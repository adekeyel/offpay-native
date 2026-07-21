import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { setAccessToken, setSessionExpiredHandler } from '../api/client';
import * as authApi from '../api/auth';
import {
  getRefreshToken, setRefreshToken, clearSession as clearStoredSession,
  getCachedUser, setCachedUser,
} from '../auth/secureStorage';
import { setLocalPin, verifyLocalPin, hasLocalPin, type PinVerifyResult } from '../auth/localAuth';
import { isPickerSessionActive } from '../utils/pickerSession';
import type { User } from '../types/api';

type SessionState =
  | { status: 'loading' }
  | { status: 'unauthenticated' } // no refresh token on this device at all — show landing/register/login
  | { status: 'locked' } // known device, but needs PIN/biometric before anything else
  | { status: 'needs-pin-setup'; user: User } // just authenticated (register or legacy login), but no app-lock PIN exists yet
  | { status: 'unlocked'; user: User; offline?: boolean }; // `offline: true` means we unlocked from the local PIN hash without reaching the server this time

/** Friendly message for a locked-out local PIN check — shared by app-lock and transaction PIN screens. */
export function formatLockoutMessage(retryAt: number): string {
  const seconds = Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
  return `Too many wrong attempts. Try again in ${seconds}s.`;
}

interface AuthContextValue {
  session: SessionState;
  loginWithPassword: (email: string, password: string, deviceId: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<void>;
  completeRegistrationLogin: (accessToken: string, refreshToken: string, user: User, appLockPinSet: boolean) => Promise<void>;
  confirmPinSet: (user: User, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  useDifferentAccount: () => Promise<void>;
  /** Fully offline — verifies a transaction PIN against the on-device hash only. Used before signing/sending any offline voucher. */
  verifyTransactionPin: (pin: string) => Promise<PinVerifyResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'loading' });
  // Tracks whether the PIN has already been entered for the CURRENT app
  // foreground session — resets every time the app goes to background and
  // comes back, which is exactly the "leave the app, come back, need PIN
  // again" requirement. Deliberately in-memory only (not persisted), same
  // idea as the web app's sessionStorage flag.
  const unlockedThisForeground = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        setSession({ status: 'unauthenticated' });
        return;
      }
      setSession({ status: 'locked' });
    })();

    setSessionExpiredHandler(() => {
      // A 401 that survives a refresh attempt means the refresh token
      // itself is dead server-side — that's a real "log in again" case,
      // not something a local PIN can recover from, so this deliberately
      // does NOT fire just because a request failed from being offline
      // (see api/client.ts: network failures there throw a different way
      // and are handled per-screen, not through this handler).
      unlockedThisForeground.current = false;
      setSession({ status: 'unauthenticated' });
    });
  }, []);

  // How long the app can sit in the background before we consider it a real
  // "left the app" event that should re-lock. Anything shorter than this is
  // almost always the app itself briefly losing foreground focus — opening
  // the native image/document picker, the camera, an OS permission dialog,
  // the share sheet, or a phone call/notification banner — NOT the user
  // switching away. Without this grace period, tapping "Attach NIN slip" or
  // "Attach utility bill" on the Tier Upgrade screen (which has to hand off
  // to the OS photo picker) instantly re-locked the app the moment the
  // picker opened, wiping the in-progress form the second the user came
  // back and re-entered their PIN. 15s comfortably covers a picker/camera
  // round-trip while still re-locking promptly for a genuine app switch.
  const BACKGROUND_LOCK_GRACE_MS = 15000;
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const wasActive = appState.current === 'active';
      const goingBackground = wasActive && next !== 'active';
      const cameToForeground = appState.current !== 'active' && next === 'active';
      appState.current = next;

      if (goingBackground) {
        backgroundedAt.current = Date.now();
        return;
      }

      if (cameToForeground) {
        const awayMs = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (isPickerSessionActive()) {
          // A native picker (photo library, camera, document picker) is
          // still open or just closed — never lock mid-picker no matter
          // how long the user spent browsing albums.
          return;
        }
        if (awayMs >= BACKGROUND_LOCK_GRACE_MS) {
          // Genuinely left the app for a while — matches "leave the app,
          // come back, need PIN" rather than just a logout-on-close.
          unlockedThisForeground.current = false;
          setSession((prev) => (prev.status === 'unlocked' ? { status: 'locked' } : prev));
        }
      }
    });
    return () => sub.remove();
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string, deviceId: string) => {
    // Logging in for the first time on a device inherently needs the
    // server — there's nothing local yet to check the password against.
    const res = await authApi.login(email, password, deviceId);
    await setRefreshToken(res.data.refreshToken);
    await setCachedUser(res.data.user);
    setAccessToken(res.data.accessToken);

    if (!res.data.appLockPinSet) {
      unlockedThisForeground.current = true;
      setSession({ status: 'needs-pin-setup', user: res.data.user });
      return;
    }

    // The server already has a PIN for this account, but that doesn't mean
    // THIS device has ever had it typed in — a fresh install, or a device
    // that's never been through one online unlock cycle, has no local PIN
    // hash yet (see localAuth.ts). Going straight to 'unlocked' here would
    // leave this device with no way to check the PIN offline until it
    // happened to background-and-reopen the app while still online — which,
    // if it never does before losing signal, means offline unlock never
    // works at all. Instead, route through the lock screen once right now,
    // while we still definitely have network from the login call that just
    // succeeded — that one PIN entry plants the local hash (via
    // unlockWithPin's migration path below) and every unlock after this
    // works fully offline.
    const localHashExists = await hasLocalPin('lock');
    if (!localHashExists) {
      setSession({ status: 'locked' });
      return;
    }

    unlockedThisForeground.current = true;
    setSession({ status: 'unlocked', user: res.data.user });
  }, []);

  const completeRegistrationLogin = useCallback(async (accessToken: string, refreshToken: string, user: User, appLockPinSet: boolean) => {
    await setRefreshToken(refreshToken);
    await setCachedUser(user);
    setAccessToken(accessToken);
    unlockedThisForeground.current = true;
    setSession(appLockPinSet ? { status: 'unlocked', user } : { status: 'needs-pin-setup', user });
  }, []);

  const confirmPinSet = useCallback(async (user: User, pin: string) => {
    // The server call that actually sets the app-lock PIN happens at the
    // call site (StandaloneSetPinScreen) since it needs the current
    // password too — this just mirrors the result into the local hash so
    // every unlock from here on can be checked on-device.
    await setLocalPin('lock', pin);
    setSession({ status: 'unlocked', user });
  }, []);

  const unlockWithPin = useCallback(async (pin: string) => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      setSession({ status: 'unauthenticated' });
      throw new Error('No saved session on this device. Please log in.');
    }

    const localHashExists = await hasLocalPin('lock');

    if (localHashExists) {
      // The whole point: check the PIN against the on-device hash first.
      // This needs no network at all, so it works with the phone in
      // airplane mode, no SIM, anywhere with no signal — exactly the
      // situation this app is built around.
      const result = await verifyLocalPin('lock', pin);
      if (!result.ok) {
        if (result.reason === 'locked-out') throw new Error(formatLockoutMessage(result.retryAt));
        if (result.reason === 'wrong-pin') throw new Error(`Incorrect PIN. ${result.attemptsRemaining} attempt(s) left.`);
        // 'no-local-pin' can't happen here since we just checked localHashExists, but fall through safely.
        return;
      }

      unlockedThisForeground.current = true;
      const cachedUser = await getCachedUser();

      if (!cachedUser) {
        // Extremely unlikely (would mean the local PIN hash survived but
        // the cached user snapshot didn't), but don't unlock into a broken
        // session if it happens — fall through to an online unlock instead,
        // which will also refresh the cached user for next time.
        try {
          const res = await authApi.unlock(refreshToken, pin);
          setAccessToken(res.data.accessToken);
          await setCachedUser(res.data.user);
          unlockedThisForeground.current = true;
          setSession({ status: 'unlocked', user: res.data.user });
        } catch {
          throw new Error('Could not restore your session. Connect to the internet once, then this will work offline again.');
        }
        return;
      }

      // Unlock the app immediately on the correct local PIN — don't make
      // the person wait on (or fail because of) a network call just to
      // get back into an app they already proved who they are on.
      setSession({ status: 'unlocked', user: cachedUser, offline: true });

      // Best-effort, in the background: refresh the access token if we do
      // have connectivity, so screens that need live data (balance,
      // transaction history, etc.) work right away instead of only after
      // the next foreground/background cycle. If this fails (no signal),
      // the person stays unlocked regardless — only screens that actually
      // need the network will show their own offline message.
      authApi.unlock(refreshToken, pin)
        .then((res) => {
          setAccessToken(res.data.accessToken);
          setCachedUser(res.data.user);
          setSession({ status: 'unlocked', user: res.data.user });
        })
        .catch(() => { /* still offline — that's fine, stay unlocked from the local check above */ });
      return;
    }

    // Migration path: this device has a refresh token from before local
    // PIN hashing existed (an app update), so there's no local hash yet —
    // this one time still needs the server, and on success we plant the
    // local hash so every unlock after this is offline-capable.
    try {
      const res = await authApi.unlock(refreshToken, pin);
      setAccessToken(res.data.accessToken);
      await setCachedUser(res.data.user);
      await setLocalPin('lock', pin);
      unlockedThisForeground.current = true;
      setSession({ status: 'unlocked', user: res.data.user });
    } catch (err: any) {
      if (err.message === 'Session expired. Please log in again.') throw err;
      throw new Error('Could not verify your PIN. Connect to the internet once to enable offline unlock, then this will work anywhere.');
    }
  }, []);

  const verifyTransactionPin = useCallback(async (pin: string): Promise<PinVerifyResult> => {
    return verifyLocalPin('transaction', pin);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try { await authApi.logout(refreshToken); } catch { /* best-effort server-side revoke */ }
    await clearStoredSession();
    setAccessToken(null);
    unlockedThisForeground.current = false;
    setSession({ status: 'unauthenticated' });
  }, []);

  // Same as logout, from the unlock screen's "not you?" link — semantically
  // identical, kept as a separate name for clarity at the call site.
  const useDifferentAccount = logout;

  return (
    <AuthContext.Provider value={{
      session, loginWithPassword, unlockWithPin, completeRegistrationLogin, confirmPinSet,
      logout, useDifferentAccount, verifyTransactionPin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
