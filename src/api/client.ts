import { getRefreshToken, setRefreshToken } from '../auth/secureStorage';
import { readCache, writeCache } from '../offline/dataCache';
import { setIsOnline } from '../offline/connectivity';

// Expo inlines EXPO_PUBLIC_ prefixed env vars at build time, same pattern as
// Next.js's NEXT_PUBLIC_ — set this in your .env or eas.json per environment.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// The backend serves /uploads (passport photos, ad media, etc.) directly off
// the app root, not under /api — see src/app.js on the backend.
export const ASSET_BASE_URL = API_URL.replace(/\/api\/?$/, '');

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

/** Registered once by AuthContext — called when the refresh token itself is invalid/expired, so the app can route to a full login. */
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  isForm?: boolean;
  skipAuthRetry?: boolean;
  /**
   * When set, a successful GET response is saved to on-device storage under
   * this key. If a later call to the same key fails purely because we're
   * offline, the last saved response is served instead of throwing — so
   * "your data" (balance, transactions, products, etc.) stays visible with
   * no signal. Only meant for read (GET) requests; ignored otherwise.
   */
  cacheKey?: string;
}

/**
 * Every screen calls through this — never fetch() directly — so token
 * attachment and refresh-on-401 stay consistent everywhere.
 */
export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, isForm = false, skipAuthRetry = false, cacheKey } = options;

  const doFetch = async (token: string | null) => {
    return fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });
  };

  let res: Response;
  try {
    res = await doFetch(accessToken);
    setIsOnline(true);
  } catch (err) {
    setIsOnline(false);
    // fetch() itself throws (rather than resolving with a bad status) when
    // there's no network path to the server at all — no signal, airplane
    // mode, DNS failure, etc. If we have a cached response for this exact
    // read, serve that instead of an error — that's what lets every screen
    // keep showing the user's data while offline.
    if (cacheKey) {
      const cached = await readCache<T>(cacheKey);
      if (cached) return { ...(cached.json as any), fromCache: true, cachedAt: cached.cachedAt } as T;
    }
    // Left alone, the raw error surfaces to the user as something like
    // "java.net.UnknownHostException: Unable to resolve host ...", which is
    // meaningless to a non-technical user. Normalize it here, once, so every
    // screen's existing `catch (err) { err.message }` handling shows
    // something sane without each screen needing its own network-awareness.
    throw Object.assign(new Error("You're offline. Connect to the internet and try again."), { isOffline: true });
  }

  if (res.status === 401 && !skipAuthRetry) {
    try {
      const newToken = await refreshAccessToken();
      res = await doFetch(newToken);
    } catch (err: any) {
      if (err?.isOffline) {
        if (cacheKey) {
          const cached = await readCache<T>(cacheKey);
          if (cached) return { ...(cached.json as any), fromCache: true, cachedAt: cached.cachedAt } as T;
        }
        throw err;
      }
      await setRefreshToken(null);
      setAccessToken(null);
      onSessionExpired?.();
      throw new Error('Session expired. Please log in again.');
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(json.message || 'Request failed.'), { details: json.details });
  }
  if (cacheKey && method === 'GET') {
    await writeCache(cacheKey, json);
  }
  return json;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token on this device.');

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    setIsOnline(true);
  } catch (err) {
    setIsOnline(false);
    throw Object.assign(new Error("You're offline."), { isOffline: true });
  }
  if (!res.ok) throw new Error('Refresh failed.');
  const json = await res.json();
  setAccessToken(json.data.accessToken);
  return json.data.accessToken;
}
