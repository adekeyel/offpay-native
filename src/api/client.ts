import { getRefreshToken, setRefreshToken } from '../auth/secureStorage';

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
}

/**
 * Every screen calls through this — never fetch() directly — so token
 * attachment and refresh-on-401 stay consistent everywhere.
 */
export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, isForm = false, skipAuthRetry = false } = options;

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

  let res = await doFetch(accessToken);

  if (res.status === 401 && !skipAuthRetry) {
    try {
      const newToken = await refreshAccessToken();
      res = await doFetch(newToken);
    } catch {
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
  return json;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token on this device.');

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Refresh failed.');
  const json = await res.json();
  setAccessToken(json.data.accessToken);
  return json.data.accessToken;
}
