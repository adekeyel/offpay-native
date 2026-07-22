import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, FlatList, Modal } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import PinInput from '../../components/PinInput';
import AppFooter from '../../components/AppFooter';
import * as bankApi from '../../api/bank';
import type { Bank } from '../../api/bank';
import * as securityApi from '../../api/security';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';

type Step = 'details' | 'confirm' | 'otp' | 'done';

export default function BankTransferScreen() {
  const { isOnline } = useNetworkStatus();
  const [step, setStep] = useState<Step>('details');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pinResetSignal, setPinResetSignal] = useState(0);
  const [result, setResult] = useState<{ message: string } | null>(null);
  const [otpMethod, setOtpMethod] = useState<'google' | 'email' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [pin, setPin] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  useEffect(() => {
    if (!isOnline) return;
    bankApi.listBanks().then((res: any) => {
      setBanks(res.data);
      if (res.warning) setError(res.warning);
    }).catch(() => setError('Could not load bank list.'));
  }, [isOnline]);

  useEffect(() => {
    setAccountName(null);
    setError(null);
    if (!selectedBank || accountNumber.length !== 10) return;

    const handle = setTimeout(async () => {
      setResolving(true);
      try {
        const res = await bankApi.resolveExternalAccount(accountNumber, selectedBank.code);
        setAccountName(res.data.accountName);
      } catch (err: any) {
        setError(err.message || 'Could not resolve this account. Check the details and try again.');
      } finally {
        setResolving(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [accountNumber, selectedBank]);

  function proceedToConfirm() {
    setError(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount.');
    if (!accountName || !selectedBank) return setError('Resolve a valid account first.');
    setStep('confirm');
  }

  async function submitWithPin(enteredPin: string) {
    if (!selectedBank) return;
    setPin(enteredPin);
    setSubmitting(true);
    setError(null);
    try {
      const res = await bankApi.transferToBank({
        accountNumber, bankCode: selectedBank.code, bankName: selectedBank.name,
        amount: parseFloat(amount), narration: narration || undefined, pin: enteredPin,
      });
      setResult({ message: res.message });
      setStep('done');
    } catch (err: any) {
      if (err.details?.code === 'TRANSFER_OTP_REQUIRED') {
        setOtpMethod(err.details.method);
        setStep('otp');
        return;
      }
      setError(err.message || 'Transfer could not be completed.');
      setPinResetSignal((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendEmailOtp() {
    setSendingEmailOtp(true);
    setError(null);
    try {
      await securityApi.requestTransferOtp();
      setEmailOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Could not send code.');
    } finally {
      setSendingEmailOtp(false);
    }
  }

  async function submitWithOtp() {
    if (!selectedBank) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await bankApi.transferToBank({
        accountNumber, bankCode: selectedBank.code, bankName: selectedBank.name,
        amount: parseFloat(amount), narration: narration || undefined, pin, otpCode,
      });
      setResult({ message: res.message });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Incorrect or expired code.');
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
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Verify to continue</Text>
          <Text style={styles.subtitle}>
            {otpMethod === 'google'
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'Enter the OTP sent to your email.'}
          </Text>
          {otpMethod === 'email' && (
            <Button
              title={sendingEmailOtp ? 'Sending…' : emailOtpSent ? 'Resend code' : 'Send code'}
              variant="ghost"
              onPress={sendEmailOtp}
              disabled={sendingEmailOtp}
              style={{ marginTop: spacing.md }}
            />
          )}
          <Input label="Verification code" keyboardType="number-pad" maxLength={6} value={otpCode} onChangeText={(v) => setOtpCode(v.replace(/\D/g, ''))} />
          {error && <Alert type="error">{error}</Alert>}
          <Button title={submitting ? 'Verifying…' : 'Confirm transfer'} onPress={submitWithOtp} disabled={submitting || otpCode.length !== 6} />
          <Pressable onPress={() => setStep('confirm')} style={{ marginTop: spacing.lg }}>
            <Text style={styles.link}>Go back</Text>
          </Pressable>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Confirm transfer</Text>
          <View style={styles.summaryBox}>
            <SummaryRow label="To" value={accountName ?? ''} />
            <SummaryRow label="Bank" value={selectedBank?.name ?? ''} />
            <SummaryRow label="Account number" value={accountNumber} />
            <SummaryRow label="Amount" value={`₦${parseFloat(amount || '0').toLocaleString()}`} />
          </View>
          <Text style={styles.pinLabel}>Enter your transaction PIN to confirm</Text>
          {error && <Alert type="error">{error}</Alert>}
          <PinInput onComplete={submitWithPin} disabled={submitting} resetSignal={pinResetSignal} />
          <Pressable onPress={() => setStep('details')} style={{ marginTop: spacing.lg }}>
            <Text style={styles.link}>Go back and edit</Text>
          </Pressable>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Connect to send to a bank</Text>
          <Text style={styles.subtitle}>
            Sending to an external bank account needs an internet connection. You can still send
            or receive money with other OffPay users while offline — go to Home → To OffPay User
            or Receive.
          </Text>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Send to bank</Text>
        {error && <Alert type="error">{error}</Alert>}

        <Text style={styles.fieldLabel}>Bank</Text>
        <Pressable style={styles.bankSelect} onPress={() => setBankPickerOpen(true)}>
          <Text style={selectedBank ? styles.bankSelectText : styles.bankSelectPlaceholder}>
            {selectedBank ? selectedBank.name : 'Select a bank'}
          </Text>
        </Pressable>

        <Input
          label="Account number"
          placeholder="0123456789"
          value={accountNumber}
          onChangeText={(v) => setAccountNumber(v.replace(/[^0-9]/g, '').slice(0, 10))}
          keyboardType="number-pad"
          maxLength={10}
        />
        {resolving && <Text style={styles.resolvingText}>Looking up account…</Text>}
        {accountName && <Text style={styles.resolvedName}>{accountName}</Text>}

        <Input label="Amount (₦)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
        <Input label="Narration (optional)" value={narration} onChangeText={setNarration} />

        <Button title="Continue" onPress={proceedToConfirm} disabled={!accountName || resolving} />
      </View>

      <Modal visible={bankPickerOpen} animationType="slide" onRequestClose={() => setBankPickerOpen(false)}>
        <SafeAreaView style={styles.container}>
          <Text style={[styles.title, { padding: spacing.lg }]}>Select bank</Text>
          <FlatList
            data={banks}
            keyExtractor={(b) => b.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.bankRow}
                onPress={() => {
                  setSelectedBank(item);
                  setBankPickerOpen(false);
                }}
              >
                <Text style={styles.bankRowText}>{item.name}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
      <AppFooter />
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
  fieldLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink700, marginBottom: 6 },
  bankSelect: {
    backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md,
  },
  bankSelectText: { fontSize: fontSizes.sm, color: colors.ink, fontWeight: '600' },
  bankSelectPlaceholder: { fontSize: fontSizes.sm, color: colors.slate },
  resolvingText: { fontSize: fontSizes.xs, color: colors.slate, marginTop: -8, marginBottom: spacing.md },
  resolvedName: { fontSize: fontSizes.sm, color: colors.unlock, fontWeight: '700', marginTop: -8, marginBottom: spacing.md },
  bankRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  bankRowText: { fontSize: fontSizes.sm, color: colors.ink },
  summaryBox: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginVertical: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: fontSizes.xs, color: colors.slate },
  summaryValue: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink },
  pinLabel: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginBottom: spacing.lg },
  link: { fontSize: fontSizes.sm, color: colors.slate, textDecorationLine: 'underline', textAlign: 'center' },
});
