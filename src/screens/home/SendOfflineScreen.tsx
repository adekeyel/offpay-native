import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { useAuth } from '../../context/AuthContext';
import { getOrCreateDeviceId } from '../../auth/secureStorage';
import { getOrCreateKeypair } from '../../auth/deviceKey';
import * as offlineTransferApi from '../../api/offlineTransfer';
import { addToOutbox, removeFromOutbox } from '../../offline/voucherOutbox';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { SignedVoucher } from '../../api/offlineTransfer';

type Step = 'scan' | 'amount' | 'show-voucher' | 'done';

export default function SendOfflineScreen() {
  const { session } = useAuth();
  const senderId = session.status === 'unlocked' ? session.user.id : null;

  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('scan');
  const [receiver, setReceiver] = useState<{ userId: string; fullName: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [voucher, setVoucher] = useState<SignedVoucher | null>(null);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanLock, setScanLock] = useState(false);

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
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Could not sign the transfer on this device.' });
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

  if (step === 'scan') {
    if (!permission) return null;
    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.centered}>
            <Text style={styles.subtitle}>Camera access is needed to scan the receiver's code.</Text>
            <Button title="Grant camera access" onPress={requestPermission} style={{ marginTop: spacing.md }} />
          </View>
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
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'amount' && receiver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Send to {receiver.fullName}</Text>
          {status && <Alert type={status.type}>{status.text}</Alert>}
          <Input label="Amount (₦)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" autoFocus />
          <Button title="Sign transfer" onPress={generateVoucher} loading={loading} />
        </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginTop: 8, marginBottom: spacing.lg, lineHeight: 18 },
  qrBox: { alignSelf: 'center', padding: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  amountLabel: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: spacing.lg },
  scanOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg },
  scanHint: { color: colors.white, textAlign: 'center', fontSize: fontSizes.sm, marginBottom: spacing.sm, textShadowColor: '#000', textShadowRadius: 4 },
  link: { fontSize: fontSizes.sm, color: colors.slate, textDecorationLine: 'underline', textAlign: 'center' },
});
