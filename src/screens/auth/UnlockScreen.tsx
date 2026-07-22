import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import PinInput from '../../components/PinInput';
import Alert from '../../components/Alert';
import AppFooter from '../../components/AppFooter';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSizes } from '../../theme/colors';

export default function UnlockScreen() {
  const { unlockWithPin, useDifferentAccount } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  async function handlePin(pin: string) {
    setError(null);
    setLoading(true);
    try {
      await unlockWithPin(pin);
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN.');
      setResetSignal((n) => n + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Enter your 4-digit PIN to unlock OffPay — works even with no internet.</Text>

        <PinInput onComplete={handlePin} disabled={loading} resetSignal={resetSignal} />

        {error && <View style={{ marginTop: spacing.lg, width: '100%' }}><Alert type="error">{error}</Alert></View>}

        <Pressable onPress={useDifferentAccount} style={{ marginTop: spacing.xl }}>
          <Text style={styles.link}>Not you? Log in with a different account</Text>
        </Pressable>
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: fontSizes.base, color: colors.slate, marginTop: 6, marginBottom: spacing.xl },
  link: { fontSize: fontSizes.sm, color: colors.slate, textDecorationLine: 'underline' },
});
