/**
 * Module-level (deliberately NOT React state) flag that fully suppresses
 * the app-lock's re-lock check while a native picker — photo library,
 * camera, document picker, share sheet — is genuinely open.
 *
 * The app-lock also has a fixed grace period (see AuthContext.tsx) for
 * brief, incidental backgrounding (a permission dialog, notification
 * shade, etc). That's fine for a quick round-trip, but browsing to a
 * *different* photo album inside the system picker can easily take longer
 * than any fixed timeout — that was locking people out mid-upload on the
 * Tier Upgrade screen. This flag has no time limit: as long as a picker
 * session is open, the app simply will not re-lock, no matter how long the
 * user spends choosing a photo.
 *
 * Usage: wrap any call that hands off to a native picker.
 *   const uri = await withPickerSession(() => ImagePicker.launchImageLibraryAsync(...));
 */
let openSessions = 0;

export function isPickerSessionActive() {
  return openSessions > 0;
}

// Small buffer after the picker call resolves, to cover the case where the
// native "app became active again" event and the picker promise resolving
// arrive in either order — without this, a lock check landing a beat before
// the picker's own resolution would still see the flag as active, but one
// landing a beat after could otherwise slip through right as we clear it.
const CLEAR_DELAY_MS = 2000;

export async function withPickerSession<T>(fn: () => Promise<T>): Promise<T> {
  openSessions += 1;
  try {
    return await fn();
  } finally {
    setTimeout(() => {
      openSessions = Math.max(0, openSessions - 1);
    }, CLEAR_DELAY_MS);
  }
}
