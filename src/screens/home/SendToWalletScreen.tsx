import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import PinInput from '../../components/PinInput';
import * as walletApi from '../../api/wallet';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';

type Step = 'details' | 'confirm' | 'done';

/**
 * Send money to another OffPay user's wallet ID instantly, online — no QR
 * code, no physical proximity needed. This settles immediately (both
 * wallets are on the same server), unlike the offline voucher flow in
 * SendOfflineScreen which is built for zero-connectivity, in-person
 * transfers. Use that one instead when there's no signal.
 */
export default function SendToWalletScreen() {
  const { isOnline } = useNetworkStatus();
  const [step, setStep] = useState<Step>('details');
  const [walletId, setWalletId] = useState('');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pinResetSignal, setPinResetSignal] = useState(0);
  const [result, setResult] = useState<{ message: string } | null>(null);

  async function lookupWallet() {
    setError(null);
    setRecipientName(null);
    if (!walletId.trim()) return setError('Enter a wallet ID.');
    setResolving(true);
    try {
      const res = await walletApi.resolveWallet(walletId.trim());
      setRecipientName(res.data.accountName);
    } catch (err: any) {
      setError(err.message || 'Could not find that wallet ID. Check the ID and try again.');
    } finally {
      setResolving(false);
    }
  }

  function proceedToConfirm() {
    setError(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount.');
    if (!recipientName) return setError('Look up a valid wallet ID first.');
    setStep('confirm');
  }

  async function submitWithPin(pin: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await walletApi.sendToWallet({
        recipientWalletId: walletId.trim(), amount: parseFloat(amount), narration: narration || undefined, pin,
      });
      setResult({ message: res.message });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Transfer could not be completed.');
      setPinResetSignal((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'done') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Transfer sent</Text>
          <Text style={styles.subtitle}>{result?.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Confirm transfer</Text>
          <View style={styles.summaryBox}>
            <SummaryRow label="To" value={recipientName ?? ''} />
            <SummaryRow label="Wallet ID" value={walletId.trim()} />
            <SummaryRow label="Amount" value={`₦${parseFloat(amount || '0').toLocaleString()}`} />
          </View>
          <Text style={styles.pinLabel}>Enter your transaction PIN to confirm</Text>
          {error && <Alert type="error">{error}</Alert>}
          <PinInput onComplete={submitWithPin} disabled={submitting} resetSignal={pinResetSignal} />
          <Pressable onPress={() => setStep('details')} style={{ marginTop: spacing.lg }}>
            <Text style={styles.link}>Go back and edit</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Connect to send online</Text>
          <Text style={styles.subtitle}>
            Instant wallet-to-wallet transfer needs an internet connection. With no signal, use
            Home → To OffPay User → Send nearby (offline) instead — it works fully offline via QR code.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Send to OffPay wallet</Text>
        {error && <Alert type="error">{error}</Alert>}

        <Input
          label="Recipient wallet ID"
          placeholder="OP-0000-0000"
          value={walletId}
          onChangeText={(v) => { setWalletId(v); setRecipientName(null); }}
          autoCapitalize="characters"
          onBlur={lookupWallet}
        />
        {resolving && <Text style={styles.resolvingText}>Looking up wallet…</Text>}
        {recipientName && <Text style={styles.resolvedName}>{recipientName}</Text>}
        {!recipientName && !resolving && walletId.trim().length > 0 && (
          <Button title="Find wallet" variant="ghost" onPress={lookupWallet} style={{ marginBottom: spacing.md }} />
        )}

        <Input label="Amount (₦)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
        <Input label="Narration (optional)" value={narration} onChangeText={setNarration} />

        <Button title="Continue" onPress={proceedToConfirm} disabled={!recipientName || resolving} />
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  resolvingText: { fontSize: fontSizes.xs, color: colors.slate, marginTop: -8, marginBottom: spacing.md },
  resolvedName: { fontSize: fontSizes.sm, color: colors.unlock, fontWeight: '700', marginTop: -8, marginBottom: spacing.md },
  summaryBox: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginVertical: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: fontSizes.xs, color: colors.slate },
  summaryValue: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink },
  pinLabel: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginBottom: spacing.lg },
  link: { fontSize: fontSizes.sm, color: colors.slate, textDecorationLine: 'underline', textAlign: 'center' },
});
