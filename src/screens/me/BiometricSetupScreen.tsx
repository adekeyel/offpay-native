import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Pressable, Linking, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as securityApi from '../../api/security';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { MeStackParamList } from '../../navigation/MainTabNavigator';

type Props = NativeStackScreenProps<MeStackParamList, 'BiometricSetup'>;

type DeviceCheck =
  | { status: 'checking' }
  | { status: 'no-hardware' }
  | { status: 'not-enrolled'; label: string }
  | { status: 'ready'; label: string };

/**
 * Reached from the "Enable Biometrics" toggle in Settings & Security the
 * first time it's switched on — previously that toggle just called the API
 * directly with no actual enrollment step, so "enabling biometrics" never
 * confirmed the device could actually do it. This screen detects what the
 * device supports (fingerprint, Face ID/face recognition, or iris) and asks
 * for one real biometric confirmation via the OS prompt before turning the
 * setting on server-side.
 */
export default function BiometricSetupScreen({ navigation }: Props) {
  const [check, setCheck] = useState<DeviceCheck>({ status: 'checking' });
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setCheck({ status: 'no-hardware' });
        return;
      }
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const label = describeTypes(types);
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setCheck(isEnrolled ? { status: 'ready', label } : { status: 'not-enrolled', label });
    })();
  }, []);

  async function confirmAndEnable() {
    setError(null);
    setConfirming(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm to enable biometric login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (!result.success) {
        setConfirming(false);
        if (result.error !== 'user_cancel') setError('Could not confirm your biometric. Please try again.');
        return;
      }
      await securityApi.setBiometrics(true);
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Could not enable biometrics.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {check.status === 'checking' && <ActivityIndicator style={{ marginTop: spacing.xl }} />}

        {check.status === 'no-hardware' && (
          <>
            <Text style={styles.icon}>🚫</Text>
            <Text style={styles.title}>No biometric hardware found</Text>
            <Text style={styles.body}>
              This device doesn't have a fingerprint sensor or face recognition camera, so biometric login can't be
              set up here.
            </Text>
          </>
        )}

        {check.status === 'not-enrolled' && (
          <>
            <Text style={styles.icon}>{iconFor(check.label)}</Text>
            <Text style={styles.title}>Set up {check.label} on your device first</Text>
            <Text style={styles.body}>
              Your device supports {check.label}, but none is registered yet. Add one in your device settings, then
              come back here to finish enabling it in OffPay.
            </Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable
              style={styles.primaryBtn}
              onPress={() => (Platform.OS === 'ios' ? Linking.openURL('App-Prefs:root') : Linking.openSettings())}
            >
              <Text style={styles.primaryBtnText}>Open device settings</Text>
            </Pressable>
          </>
        )}

        {check.status === 'ready' && (
          <>
            <Text style={styles.icon}>{iconFor(check.label)}</Text>
            <Text style={styles.title}>Set up {check.label}</Text>
            <Text style={styles.body}>
              Confirm with {check.label} to turn on biometric login and approvals for this device. You'll be asked
              for it again whenever you unlock the app or approve a transaction.
            </Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primaryBtn} onPress={confirmAndEnable} disabled={confirming}>
              {confirming ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Confirm with {check.label}</Text>}
            </Pressable>
          </>
        )}

        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** Turns the raw AuthenticationType enum values into the label the person actually sees on their device (fingerprint vs Face ID/face recognition vs iris). */
function describeTypes(types: LocalAuthentication.AuthenticationType[]): string {
  const has = (t: LocalAuthentication.AuthenticationType) => types.includes(t);
  const facial = has(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const fingerprint = has(LocalAuthentication.AuthenticationType.FINGERPRINT);
  const iris = has(LocalAuthentication.AuthenticationType.IRIS);

  if (facial && fingerprint) return 'Face ID / Fingerprint';
  if (facial) return Platform.OS === 'ios' ? 'Face ID' : 'face recognition';
  if (fingerprint) return 'fingerprint';
  if (iris) return 'iris recognition';
  return 'biometrics';
}

function iconFor(label: string): string {
  if (/face/i.test(label)) return '🙂';
  if (/iris/i.test(label)) return '👁';
  return '👆';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  body: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  error: { fontSize: fontSizes.xs, color: colors.danger, textAlign: 'center', marginTop: spacing.md },
  primaryBtn: {
    backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: spacing.xl,
    marginTop: spacing.xl, minWidth: 220, alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.sm },
  cancelBtn: { marginTop: spacing.lg, padding: spacing.sm },
  cancelText: { color: colors.slate, fontSize: fontSizes.sm, textDecorationLine: 'underline' },
});
