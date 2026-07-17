import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { setAccessToken, setSessionExpiredHandler } from '../api/client';
import * as authApi from '../api/auth';
import { getRefreshToken, setRefreshToken, clearSession as clearStoredSession } from '../auth/secureStorage';
import type { User } from '../types/api';

type SessionState =
  | { status: 'loading' }
  | { status: 'unauthenticated' } // no refresh token on this device at all — show landing/register/login
  | { status: 'locked' } // known device, but needs PIN/biometric before anything else
  | { status: 'needs-pin-setup'; user: User } // just authenticated (register or legacy login), but no app-lock PIN exists yet
  | { status: 'unlocked'; user: User };

interface AuthContextValue {
  session: SessionState;
  loginWithPassword: (email: string, password: string, deviceId: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<void>;
  completeRegistrationLogin: (accessToken: string, refreshToken: string, user: User, appLockPinSet: boolean) => Promise<void>;
  confirmPinSet: (user: User) => void;
  logout: () => Promise<void>;
  useDifferentAccount: () => Promise<void>;
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
      unlockedThisForeground.current = false;
      setSession({ status: 'unauthenticated' });
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const wasActive = appState.current === 'active';
      const goingBackground = wasActive && next !== 'active';
      appState.current = next;

      if (goingBackground) {
        // Leaving the app (even briefly) re-locks it — matches "leave the
        // app, come back, need PIN" rather than just a logout-on-close.
        unlockedThisForeground.current = false;
        setSession((prev) => (prev.status === 'unlocked' ? { status: 'locked' } : prev));
      }
    });
    return () => sub.remove();
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string, deviceId: string) => {
    const res = await authApi.login(email, password, deviceId);
    await setRefreshToken(res.data.refreshToken);
    setAccessToken(res.data.accessToken);
    unlockedThisForeground.current = true;
    setSession(
      res.data.appLockPinSet
        ? { status: 'unlocked', user: res.data.user }
        : { status: 'needs-pin-setup', user: res.data.user }
    );
  }, []);

  const completeRegistrationLogin = useCallback(async (accessToken: string, refreshToken: string, user: User, appLockPinSet: boolean) => {
    await setRefreshToken(refreshToken);
    setAccessToken(accessToken);
    unlockedThisForeground.current = true;
    setSession(appLockPinSet ? { status: 'unlocked', user } : { status: 'needs-pin-setup', user });
  }, []);

  const confirmPinSet = useCallback((user: User) => {
    setSession({ status: 'unlocked', user });
  }, []);

  const unlockWithPin = useCallback(async (pin: string) => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      setSession({ status: 'unauthenticated' });
      throw new Error('No saved session on this device. Please log in.');
    }
    const res = await authApi.unlock(refreshToken, pin);
    setAccessToken(res.data.accessToken);
    unlockedThisForeground.current = true;
    setSession({ status: 'unlocked', user: res.data.user });
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
    <AuthContext.Provider value={{ session, loginWithPassword, unlockWithPin, completeRegistrationLogin, confirmPinSet, logout, useDifferentAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
