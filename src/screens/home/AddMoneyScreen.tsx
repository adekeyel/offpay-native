import AdBanner from '../../components/AdBanner';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as walletApi from '../../api/wallet';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { colors, spacing, radius, fontSizes } from '../../theme/colors';
import type { WalletSummary } from '../../types/api';

export default function AddMoneyScreen() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      walletApi
        .getWalletSummary()
        .then((res) => setSummary(res.data))
        .catch((err) => setError(err.message || 'Could not load your account details.'))
        .finally(() => setLoading(false));
    }, [])
  );

  async function shareDetails() {
    if (!summary?.accountNumber) return;
    await Share.share({
      message: `Send money to my OffPay account:\n\nBank: ${summary.bankName}\nAccount Number: ${summary.accountNumber}`,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdBanner page="add-money" position="top" />
        {error && <Alert type="error">{error}</Alert>}

        {!loading && summary && !summary.accountNumber && (
          <Alert type="info">
            Your dedicated account number isn't ready yet — this is issued automatically once your identity
            verification (KYC) is approved. If you already submitted your details, an admin is still reviewing them.
          </Alert>
        )}

        {summary?.accountNumber && (
          <>
            <Text style={styles.label}>Transfer any amount to this account to fund your OffPay wallet.</Text>
            <View style={styles.card}>
              <Row label="Bank" value={summary.bankName ?? ''} />
              <Row label="Account Number" value={summary.accountNumber} big />
              <Row label="Account Name" value="OffPay" />
            </View>
            <Text style={styles.note}>
              Deposits are credited automatically, usually within a minute of the transfer being confirmed by your
              bank.
            </Text>
            <Button title="Share account details" variant="ghost" onPress={shareDetails} style={{ marginTop: spacing.lg }} />
          </>
        )}
        <AdBanner page="add-money" position="bottom" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, big && styles.rowValueBig]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  label: { fontSize: fontSizes.base, color: colors.slate, marginBottom: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  row: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: { fontSize: fontSizes.xs, color: colors.slate, marginBottom: 4 },
  rowValue: { fontSize: fontSizes.md, fontWeight: '600', color: colors.ink },
  rowValueBig: { fontSize: fontSizes.xl, fontWeight: '700', letterSpacing: 0.5 },
  note: { fontSize: fontSizes.sm, color: colors.slate, marginTop: spacing.lg, lineHeight: 18 },
});
