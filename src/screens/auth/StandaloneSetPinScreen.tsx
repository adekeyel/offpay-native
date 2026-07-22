import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import PinInput from '../../components/PinInput';
import Alert from '../../components/Alert';
import AppFooter from '../../components/AppFooter';
import * as authApi from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSizes } from '../../theme/colors';
import type { User } from '../../types/api';

export default function StandaloneSetPinScreen({ user }: { user: User }) {
  const { confirmPinSet } = useAuth();
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFirstEntry(pin: string) {
    setFirstPin(pin);
  }

  async function handleConfirmEntry(pin: string) {
    if (pin !== firstPin) {
      setError("PINs don't match — try again from the start.");
      setFirstPin(null); // changing the key below remounts PinInput fresh
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.setAppLockPin(pin);
      await confirmPinSet(user, pin);
    } catch (err: any) {
      setError(err.message || 'Could not set PIN.');
      setFirstPin(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Set your app-lock PIN</Text>
        <Text style={styles.subtitle}>
          This 4-digit PIN is separate from your password — you'll use it to quickly unlock OffPay
          each time you come back, instead of logging in from scratch. Once set, unlocking works
          even with no internet connection.
        </Text>

        {error && <Alert type="error">{error}</Alert>}

        <Text style={styles.stepLabel}>{firstPin ? 'Confirm your PIN' : 'Choose a 4-digit PIN'}</Text>
        <PinInput
          key={firstPin ? 'confirm' : 'first'}
          onComplete={firstPin ? handleConfirmEntry : handleFirstEntry}
          disabled={loading}
        />
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: fontSizes.base, color: colors.slate, marginTop: 8, marginBottom: spacing.xl, textAlign: 'center', lineHeight: 20 },
  stepLabel: { fontSize: fontSizes.base, fontWeight: '600', color: colors.ink, marginBottom: spacing.md },
});
