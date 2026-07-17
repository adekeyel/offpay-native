import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { getOrCreateKeypair } from '../auth/deviceKey';
import { getOrCreateDeviceId } from '../auth/secureStorage';
import * as walletApi from '../api/wallet';

/**
 * Runs once per unlocked session: makes sure this device has a registered
 * Ed25519 signing key (needed before it can ever send an offline transfer)
 * and, best-effort, an Expo push token (needed for offline-sync
 * confirmations). Both failures are swallowed — a device without push
 * notifications yet still works fine, it just won't get a push the moment
 * a transfer settles; the balance will still be correct next time the app
 * opens.
 */
export function useDeviceSetup() {
  const { session } = useAuth();
  const didRun = useRef(false);

  useEffect(() => {
    if (session.status !== 'unlocked' || didRun.current) return;
    didRun.current = true;

    (async () => {
      const deviceId = await getOrCreateDeviceId();
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      try {
        const { publicKeyB64 } = await getOrCreateKeypair();
        await walletApi.registerDeviceKey(deviceId, publicKeyB64, platform);
      } catch {
        // Non-fatal — offline sending will simply fail with a clear error
        // until this succeeds on a later app open with connectivity.
      }

      try {
        const { status } = await Notifications.getPermissionsAsync();
        let finalStatus = status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          finalStatus = req.status;
        }
        if (finalStatus !== 'granted') return;

        // Requires an EAS project configured (app.json -> extra.eas.projectId)
        // to actually issue a token — run `eas init` before this works.
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
        await walletApi.registerPushToken(deviceId, expoPushToken, platform);
      } catch {
        // No EAS project configured yet, or permission denied — fine, see above.
      }
    })();
  }, [session.status]);
}
