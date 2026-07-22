import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { getOrCreateKeypair } from '../auth/deviceKey';
import { getOrCreateDeviceId } from '../auth/secureStorage';
import * as walletApi from '../api/wallet';

// Runs once at module load (i.e. as soon as the app imports this file, well
// before any push notification can arrive). Without a handler configured,
// Expo's default behavior is to NOT show or play a sound for notifications
// received while the app is in the foreground — this was the main reason
// notifications (and the bell) appeared silent, since the backend already
// sends `sound: 'default'` on every push (see push.service.js).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

      // Android requires an explicit notification channel (with its own
      // sound/importance settings) to reliably play a sound and show a
      // heads-up banner — without this, background pushes on Android can
      // arrive silently even though the server requested a sound.
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'OffPay notifications',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 200, 150, 200],
            lightColor: '#1F9D74',
          });
        } catch {
          // Non-fatal — worst case, notifications fall back to the system default channel.
        }
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
