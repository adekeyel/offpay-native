import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import PinInput from '../../components/PinInput';
import AppFooter from '../../components/AppFooter';
import { useAuth, formatLockoutMessage } from '../../context/AuthContext';
import { getOrCreateDeviceId, getCachedOfflineToken, setCachedOfflineToken } from '../../auth/secureStorage';
import { getOrCreateKeypair } from '../../auth/deviceKey';
import { hasLocalPin } from '../../auth/localAuth';
import * as offlineTransferApi from '../../api/offlineTransfer';
import * as walletApi from '../../api/wallet';
import { addToOutbox, removeFromOutbox } from '../../offline/voucherOutbox';
import { applyOptimisticOfflineDebit, prependOptimisticTransaction } from '../../offline/walletCache';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { SignedVoucher } from '../../api/offlineTransfer';

type Step = 'scan' | 'manual' | 'amount' | 'pin' | 'show-voucher' | 'done';

export default function SendOfflineScreen() {
  const { session, verifyTransactionPin } = useAuth();
  const senderId = session.status === 'unlocked' ? session.user.id : null;

  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('scan');
  const [receiver, setReceiver] = useState<{ userId: string; fullName: string } | null>(null);
  const [walletIdInput, setWalletIdInput] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [voucher, setVoucher] = useState<SignedVoucher | null>(null);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanLock, setScanLock] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinResetSignal, setPinResetSignal] = useState(0);
  const [txnPinReady, setTxnPinReady] = useState<'checking' | 'ready' | 'not-set'>('checking');

  useEffect(() => {
    hasLocalPin('transaction').then((ok) => setTxnPinReady(ok ? 'ready' : 'not-set'));
  }, []);

  // Checking / preparing / ready / blocked — this screen can't authorize any
  // offline spend without an unexpired offline token (see wallet.service.js's
  // reserveOfflineSpend, enforced server-side). We try to fetch a fresh one
  // now (works if we're online); if that fails, we fall back to whatever was
  // cached from a previous online session, as long as it hasn't expired.
  const [offlineReadiness, setOfflineReadiness] = useState<'checking' | 'ready' | 'blocked'>('checking');
  const [offlineLimitRemaining, setOfflineLimitRemaining] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await walletApi.prepareOfflineMode();
        await setCachedOfflineToken({ token: res.data.token, offlineLimit: res.data.offlineLimit, expiresAt: res.data.expiresAt });
        setOfflineLimitRemaining(res.data.offlineLimit);
        setOfflineReadiness('ready');
        return;
      } catch {
        // No connectivity right now (or KYC not approved, etc.) — fall back
        // to a previously cached token rather than blocking outright.
      }
      const cached = await getCachedOfflineToken();
      if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
        setOfflineLimitRemaining(cached.offlineLimit);
        setOfflineReadiness('ready');
      } else {
        setOfflineReadiness('blocked');
      }
    })();
  }, []);

  async function lookupWalletId() {
    setManualError(null);
    if (!walletIdInput.trim()) return setManualError('Enter a wallet ID.');
    setManualLoading(true);
    try {
      const res = await walletApi.resolveWallet(walletIdInput.trim());
      setReceiver({ userId: res.data.userId, fullName: res.data.accountName });
      setStep('amount');
    } catch (err: any) {
      // This lookup needs a connection (unlike the QR path, which is fully
      // offline) — a network error here just means "try the QR instead"
      // rather than something being broken.
      setManualError(err.message || 'Could not find that wallet ID. Check the ID or try scanning their QR code instead.');
    } finally {
      setManualLoading(false);
    }
  }

  function handleScan(data: string) {
    if (scanLock) return;
    setScanLock(true);
    try {
      const parsed = JSON.parse(data);
      if (!parsed.userId || !parsed.fullName) throw new Error('Not a valid OffPay receive code.');
      if (parsed.userId === senderId) throw new Error('You cannot send money to yourself.');
      setReceiver(parsed);
      setStep('amount');
    } catch {
      setStatus({ type: 'error', text: 'That QR code was not recognized. Ask the receiver to show their Receive screen.' });
      setTimeout(() => setScanLock(false), 1500);
    }
  }

  function proceedToPin() {
    setStatus(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setStatus({ type: 'error', text: 'Enter a valid amount.' });
    setPinError(null);
    setStep('pin');
  }

  async function handlePinComplete(pin: string) {
    setPinError(null);
    // Fully offline check — verified against the on-device hash only, no
    // network call, so this authorizes the transfer even with zero signal.
    const result = await verifyTransactionPin(pin);
    if (!result.ok) {
      if (result.reason === 'no-local-pin') {
        setPinError('No transaction PIN set on this device yet.');
      } else if (result.reason === 'locked-out') {
        setPinError(formatLockoutMessage(result.retryAt));
      } else {
        setPinError(`Incorrect PIN. ${result.attemptsRemaining} attempt(s) left.`);
      }
      setPinResetSignal((n) => n + 1);
      return;
    }
    await generateVoucher();
  }

  async function generateVoucher() {
    setStatus(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setStatus({ type: 'error', text: 'Enter a valid amount.' });
    if (!senderId || !receiver) return;

    setLoading(true);
    try {
      await getOrCreateKeypair(); // ensures a signing key exists on this device before we try to sign
      const signed = await offlineTransferApi.createSignedVoucher(senderId, receiver.userId, amt);
      setVoucher(signed);
      setStep('show-voucher');

      // Save to the local outbox immediately, before even trying to sync —
      // if the app crashes or closes right now, this transfer is not lost.
      const deviceId = await getOrCreateDeviceId();
      await addToOutbox({ voucher: signed, deviceId, receiverName: receiver.fullName, createdAt: Date.now() });

      // Reflect the spend right away in what Home/History show, rather than
      // leaving the balance looking untouched until the next successful
      // network fetch (which may not happen until back online).
      await applyOptimisticOfflineDebit(amt);
      await prependOptimisticTransaction({
        id: signed.nonce,
        amount: amt,
        narration: `Sent to ${receiver.fullName} (offline)`,
        direction: 'debit',
      });
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Could not sign the transfer on this device.' });
      setStep('amount');
    } finally {
      setLoading(false);
    }
  }

  async function trySync() {
    if (!voucher) return;
    setLoading(true);
    setStatus(null);
    try {
      const deviceId = await getOrCreateDeviceId();
      const res = await offlineTransferApi.syncVoucher(voucher, deviceId);
      if (res.success) {
        await removeFromOutbox(voucher.nonce);
        setStatus({ type: 'success', text: 'Transfer confirmed — money has moved.' });
        setStep('done');
        // Replace the optimistic estimate with the real, server-confirmed
        // balance and transaction record now that we have connectivity.
        walletApi.getWalletSummary().catch(() => {});
        walletApi.getTransactionHistory().catch(() => {});
      } else {
        setStatus({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      // No connectivity yet, most likely — that's fine, it's already safely
      // in the outbox and can be retried any time from Home.
      setStatus({ type: 'error', text: `Could not sync yet (${err.message}). It's saved — retry once you're back online.` });
    } finally {
      setLoading(false);
    }
  }

  if (offlineReadiness === 'checking') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.ink} />
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (offlineReadiness === 'blocked') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Connect to prepare offline mode</Text>
          <Text style={styles.subtitle}>
            OffPay caps how much you can spend offline to protect your balance. To send money
            offline, you need to open this screen at least once while connected so it can set
            your spending limit — then it'll keep working even after you lose signal.
          </Text>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (step === 'scan') {
    if (!permission) return null;
    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.centered}>
            <Text style={styles.subtitle}>Camera access is needed to scan the receiver's code.</Text>
            <Button title="Grant camera access" onPress={requestPermission} style={{ marginTop: spacing.md }} />
          </View>
          <AppFooter />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={(result) => handleScan(result.data)}
        />
        <View style={styles.scanOverlay}>
          <Text style={styles.scanHint}>Point at the receiver's Receive screen</Text>
          {status && <Alert type={status.type}>{status.text}</Alert>}
          <Pressable onPress={() => setStep('manual')} style={{ marginTop: spacing.md }}>
            <Text style={[styles.link, { color: colors.white }]}>Enter wallet ID manually instead</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'manual') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Enter wallet ID</Text>
          <Text style={styles.subtitle}>
            This needs a connection to look up the account (unlike scanning, which works fully
            offline). Ask the receiver for their wallet ID — it's shown on their Home screen.
          </Text>
          {manualError && <Alert type="error">{manualError}</Alert>}
          <Input
            label="Wallet ID"
            placeholder="OP-0000-0000"
            value={walletIdInput}
            onChangeText={setWalletIdInput}
            autoCapitalize="characters"
            autoFocus
          />
          <Button title="Find account" onPress={lookupWalletId} loading={manualLoading} />
          <Pressable onPress={() => setStep('scan')} style={{ marginTop: spacing.md }}>
            <Text style={styles.link}>Scan their QR code instead</Text>
          </Pressable>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (step === 'amount' && receiver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Send to {receiver.fullName}</Text>
          {offlineLimitRemaining != null && (
            <Text style={styles.limitText}>Up to ₦{offlineLimitRemaining.toLocaleString()} available offline right now.</Text>
          )}
          {txnPinReady === 'not-set' && (
            <Alert type="info">
              You haven't set a transaction PIN on this device yet. That needs a connection once — go to
              Settings & Security → Transaction PIN, then come back here (it'll work offline after that).
            </Alert>
          )}
          {status && <Alert type={status.type}>{status.text}</Alert>}
          <Input label="Amount (₦)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" autoFocus />
          <Button title="Continue" onPress={proceedToPin} disabled={txnPinReady !== 'ready'} />
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (step === 'pin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Enter your transaction PIN</Text>
          <Text style={styles.subtitle}>
            Authorizes sending ₦{Number(parseFloat(amount) || 0).toLocaleString()} to {receiver?.fullName}. Checked
            on this device — no internet needed.
          </Text>
          <PinInput onComplete={handlePinComplete} disabled={loading} resetSignal={pinResetSignal} />
          {pinError && <View style={{ marginTop: spacing.lg }}><Alert type="error">{pinError}</Alert></View>}
          <Pressable onPress={() => setStep('amount')} style={{ marginTop: spacing.xl }}>
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (step === 'show-voucher' && voucher && receiver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Show this to {receiver.fullName}</Text>
          <Text style={styles.subtitle}>
            They should scan this now — it's already signed and safely saved on this device, even
            if neither of you has a connection right now.
          </Text>
          <View style={styles.qrBox}>
            <QRCode value={JSON.stringify(voucher)} size={220} color={colors.ink} backgroundColor={colors.white} />
          </View>
          <Text style={styles.amountLabel}>₦{Number(voucher.amount).toLocaleString()}</Text>

          {status && <Alert type={status.type}>{status.text}</Alert>}
          <Button title="Try to sync now" onPress={trySync} loading={loading} />
          <Pressable onPress={() => setStep('done')} style={{ marginTop: spacing.md }}>
            <Text style={styles.link}>I'll sync later from Home</Text>
          </Pressable>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Text style={styles.title}>All set</Text>
        <Text style={styles.subtitle}>
          {status?.type === 'success'
            ? 'Money has moved.'
            : "This transfer is saved on your device and will sync once you're back online."}
        </Text>
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginTop: 8, marginBottom: spacing.lg, lineHeight: 18 },
  limitText: { fontSize: fontSizes.xs, color: colors.unlock, fontWeight: '600', marginBottom: spacing.md },
  qrBox: { alignSelf: 'center', padding: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  amountLabel: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: spacing.lg },
  scanOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg },
  scanHint: { color: colors.white, textAlign: 'center', fontSize: fontSizes.sm, marginBottom: spacing.sm, textShadowColor: '#000', textShadowRadius: 4 },
  link: { fontSize: fontSizes.sm, color: colors.slate, textDecorationLine: 'underline', textAlign: 'center' },
});
