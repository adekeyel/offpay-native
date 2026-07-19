import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import * as userApi from '../../api/user';
import * as authApi from '../../api/auth';
import { setLocalPin } from '../../auth/localAuth';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';

type SectionKey = 'password' | 'pin' | 'lock' | null;

export default function SettingsSecurityScreen() {
  const [openSection, setOpenSection] = useState<SectionKey>(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section
          title="Change password"
          description="Used to log in to your account."
          open={openSection === 'password'}
          onToggle={() => setOpenSection((s) => (s === 'password' ? null : 'password'))}
        >
          <ChangePasswordForm onDone={() => setOpenSection(null)} />
        </Section>

        <Section
          title="Transaction PIN"
          description="Required to authorize transfers and payments."
          open={openSection === 'pin'}
          onToggle={() => setOpenSection((s) => (s === 'pin' ? null : 'pin'))}
        >
          <TransactionPinForm onDone={() => setOpenSection(null)} />
        </Section>

        <Section
          title="App lock PIN"
          description="Required to unlock the app itself."
          open={openSection === 'lock'}
          onToggle={() => setOpenSection((s) => (s === 'lock' ? null : 'lock'))}
        >
          <AppLockPinForm onDone={() => setOpenSection(null)} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, description, open, onToggle, children }: { title: string; description: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDesc}>{description}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError(null);
    if (!currentPassword || !newPassword || !confirmPassword) return setError('All fields are required.');
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('New passwords do not match.');

    setLoading(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(onDone, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {success && <Text style={styles.successText}>Password changed.</Text>}
      <TextInput style={styles.input} placeholder="Current password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
      <TextInput style={styles.input} placeholder="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
      <TextInput style={styles.input} placeholder="Confirm new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      <SubmitButton loading={loading} onPress={submit} label="Update password" />
    </View>
  );
}

function TransactionPinForm({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError(null);
    if (!currentPassword || !pin || !confirmPin) return setError('All fields are required.');
    if (!/^\d{4}$/.test(pin)) return setError('PIN must be exactly 4 digits.');
    if (pin !== confirmPin) return setError('PINs do not match.');

    setLoading(true);
    try {
      await userApi.setTransactionPin(pin, currentPassword);
      // Mirror the new PIN into the on-device hash — this is what lets it
      // be checked offline (with zero network) before signing any offline
      // transfer, instead of only ever being usable while connected.
      await setLocalPin('transaction', pin);
      setSuccess(true);
      setCurrentPassword('');
      setPin('');
      setConfirmPin('');
      setTimeout(onDone, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not set transaction PIN.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {success && <Text style={styles.successText}>Transaction PIN updated.</Text>}
      <Text style={styles.helperText}>
        Setting this needs a connection once. After that, it works to authorize transfers — including
        offline ones — with no internet needed.
      </Text>
      <TextInput style={styles.input} placeholder="Account password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
      <TextInput style={styles.input} placeholder="New 4-digit PIN" secureTextEntry keyboardType="number-pad" maxLength={4} value={pin} onChangeText={setPin} />
      <TextInput style={styles.input} placeholder="Confirm PIN" secureTextEntry keyboardType="number-pad" maxLength={4} value={confirmPin} onChangeText={setConfirmPin} />
      <SubmitButton loading={loading} onPress={submit} label="Set transaction PIN" />
    </View>
  );
}

function AppLockPinForm({ onDone }: { onDone: () => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError(null);
    if (!pin || !confirmPin) return setError('All fields are required.');
    if (!/^\d{4}$/.test(pin)) return setError('PIN must be exactly 4 digits.');
    if (pin !== confirmPin) return setError('PINs do not match.');

    setLoading(true);
    try {
      await authApi.setAppLockPin(pin);
      // Same idea as the transaction PIN above — keep the on-device hash
      // in sync so Unlock keeps working offline after a PIN change.
      await setLocalPin('lock', pin);
      setSuccess(true);
      setPin('');
      setConfirmPin('');
      setTimeout(onDone, 1200);
    } catch (err: any) {
      setError(err.message || 'Could not set app lock PIN.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {success && <Text style={styles.successText}>App lock PIN updated.</Text>}
      <Text style={styles.helperText}>This is the PIN used to unlock the app itself — separate from your transaction PIN.</Text>
      <TextInput style={styles.input} placeholder="New 4-digit lock PIN" secureTextEntry keyboardType="number-pad" maxLength={4} value={pin} onChangeText={setPin} />
      <TextInput style={styles.input} placeholder="Confirm lock PIN" secureTextEntry keyboardType="number-pad" maxLength={4} value={confirmPin} onChangeText={setConfirmPin} />
      <SubmitButton loading={loading} onPress={submit} label="Set app lock PIN" />
    </View>
  );
}

function SubmitButton({ loading, onPress, label }: { loading: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, gap: spacing.md },
  section: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  sectionTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.ink },
  sectionDesc: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 2 },
  chevron: { fontSize: fontSizes.lg, color: colors.slate, fontWeight: '700', paddingHorizontal: spacing.sm },
  sectionBody: { padding: spacing.md, paddingTop: 0 },
  input: {
    backgroundColor: colors.paper, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: fontSizes.sm, color: colors.ink, borderWidth: 1, borderColor: colors.line,
  },
  helperText: { fontSize: fontSizes.xs, color: colors.slate },
  errorText: { color: colors.danger, fontSize: fontSizes.xs },
  successText: { color: colors.unlock, fontSize: fontSizes.xs, fontWeight: '600' },
  submitBtn: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center', marginTop: spacing.xs },
  submitText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.sm },
});
