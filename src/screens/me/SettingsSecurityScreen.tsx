import AdBanner from '../../components/AdBanner';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Pressable, ActivityIndicator, Switch, Modal, Image } from 'react-native';
import * as userApi from '../../api/user';
import * as authApi from '../../api/auth';
import * as securityApi from '../../api/security';
import type { SecuritySettings } from '../../api/security';
import { setLocalPin } from '../../auth/localAuth';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';

type SectionKey = 'password' | 'pin' | 'lock' | null;

export default function SettingsSecurityScreen() {
  const [openSection, setOpenSection] = useState<SectionKey>(null);
  const { isOnline } = useNetworkStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdBanner page="settings-security" position="top" />

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              You're offline — Google/Email 2FA toggles need a connection to change (email delivery and code
              verification both require network). Your existing settings still apply once you're back online; PIN
              and passcode changes below still work offline.
            </Text>
          </View>
        )}

        <SecurityToggles isOnline={isOnline} />

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
          title="Passcode (App lock PIN)"
          description="Required to unlock the app itself — works fully offline."
          open={openSection === 'lock'}
          onToggle={() => setOpenSection((s) => (s === 'lock' ? null : 'lock'))}
        >
          <AppLockPinForm onDone={() => setOpenSection(null)} />
        </Section>
        <AdBanner page="settings-security" position="bottom" />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * The toggle-based half of Security Settings. Google 2FA and Email 2FA are
 * both network-dependent by nature (TOTP setup needs a server round trip to
 * confirm; email OTP obviously needs email delivery), so those two toggles
 * are disabled while offline rather than allowing a change that can't
 * actually be verified. Transfer Protection and Biometrics are simple
 * on/off preferences and stay editable offline; they're just queued like any
 * other online-only POST would be the next time the app has a connection —
 * for now they show an inline error if toggled offline, same as any other
 * settings change elsewhere in the app that needs the server.
 *
 * Enforcement itself (whether a transfer actually needs a code) only ever
 * happens on the ONLINE transfer screens (BankTransferScreen,
 * SendToWalletScreen) — offline, queued transfers via SendOfflineScreen
 * never call these toggles at all, so there is nothing to bypass there by
 * construction.
 */
function SecurityToggles({ isOnline }: { isOnline: boolean }) {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [google2faModalOpen, setGoogle2faModalOpen] = useState(false);

  useEffect(() => {
    securityApi.getSettings().then((res) => setSettings(res.data)).catch((err) => setError(err.message));
  }, []);

  async function toggle(key: keyof SecuritySettings, call: (v: boolean) => Promise<any>, value: boolean) {
    setError(null);
    if (!isOnline) return setError("You're offline — reconnect to change this setting.");
    setBusyKey(key);
    try {
      await call(value);
      setSettings((s) => (s ? { ...s, [key]: value } : s));
    } catch (err: any) {
      setError(err.message || 'Could not update this setting.');
    } finally {
      setBusyKey(null);
    }
  }

  async function onToggleGoogle2fa(value: boolean) {
    if (!isOnline) return setError("You're offline — reconnect to change this setting.");
    if (value) {
      setGoogle2faModalOpen(true);
    } else {
      setError(null);
      setBusyKey('google2fa_enabled');
      try {
        await securityApi.disableGoogle2fa();
        setSettings((s) => (s ? { ...s, google2fa_enabled: false } : s));
      } catch (err: any) {
        setError(err.message || 'Could not disable Google 2FA.');
      } finally {
        setBusyKey(null);
      }
    }
  }

  if (!settings) {
    return error ? <Text style={styles.errorText}>{error}</Text> : <ActivityIndicator style={{ marginVertical: spacing.md }} />;
  }

  return (
    <View style={styles.toggleCard}>
      {error && <Text style={[styles.errorText, { padding: spacing.md, paddingBottom: 0 }]}>{error}</Text>}

      <ToggleRow
        title="Transfer Protection"
        description="Add an extra layer of security to fund transfers by requiring verification before completion."
        value={settings.transfer_protection_enabled}
        disabled={busyKey === 'transfer_protection_enabled'}
        onChange={(v) => toggle('transfer_protection_enabled', securityApi.setTransferProtection, v)}
      />
      <ToggleRow
        title="Enable Biometrics"
        description="Approve logins & transactions using Face ID on this device."
        value={settings.biometrics_enabled}
        disabled={busyKey === 'biometrics_enabled'}
        onChange={(v) => toggle('biometrics_enabled', securityApi.setBiometrics, v)}
      />
      <ToggleRow
        title="Enable Google 2FA for Withdrawals"
        description="All transactions will require a Google 2FA code generated on your device to verify your identity."
        value={settings.google2fa_enabled}
        disabled={busyKey === 'google2fa_enabled' || !isOnline}
        onChange={onToggleGoogle2fa}
      />
      <ToggleRow
        title="Enable Email 2FA for Withdrawals"
        description="All transactions will require an Email OTP code to verify your identity."
        value={settings.email2fa_withdrawals_enabled}
        disabled={busyKey === 'email2fa_withdrawals_enabled' || !isOnline}
        onChange={(v) => toggle('email2fa_withdrawals_enabled', securityApi.setEmail2fa, v)}
        last
      />

      {google2faModalOpen && (
        <Google2faSetupModal
          onClose={() => setGoogle2faModalOpen(false)}
          onEnabled={() => {
            setSettings((s) => (s ? { ...s, google2fa_enabled: true } : s));
            setGoogle2faModalOpen(false);
          }}
        />
      )}
    </View>
  );
}

function ToggleRow({
  title, description, value, disabled, onChange, last,
}: {
  title: string; description: string; value: boolean; disabled?: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, !last && styles.toggleRowBorder]}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: colors.line, true: colors.unlock }}
        thumbColor={colors.white}
      />
    </View>
  );
}

/** Step 1: fetch a fresh secret + QR. Step 2: confirm the 6-digit code the authenticator app shows to actually turn it on. */
function Google2faSetupModal({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    securityApi.startGoogle2fa().then((res) => setSetup(res.data)).catch((err) => setError(err.message));
  }, []);

  async function confirm() {
    setError(null);
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code.');
    setLoading(true);
    try {
      await securityApi.confirmGoogle2fa(code);
      onEnabled();
    } catch (err: any) {
      setError(err.message || 'Incorrect or expired code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Set up Google 2FA</Text>
          <Text style={styles.modalSubtitle}>
            Scan this with Google Authenticator (or any TOTP app), then enter the 6-digit code it shows.
          </Text>

          {setup ? (
            <>
              <Image source={{ uri: setup.qrDataUrl }} style={styles.qrImage} />
              <Text style={styles.secretText}>{setup.secret}</Text>
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
              <SubmitButton loading={loading} onPress={confirm} label="Confirm & enable" />
              <Pressable onPress={onClose} style={{ marginTop: spacing.sm, alignItems: 'center' }}>
                <Text style={styles.link}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              {!error && <ActivityIndicator style={{ marginTop: spacing.md }} />}
              {error && <Text style={styles.errorText}>{error}</Text>}
            </>
          )}
        </View>
      </View>
    </Modal>
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
  offlineBanner: { backgroundColor: colors.lockDim, borderRadius: radius.lg, padding: spacing.md },
  offlineBannerText: { fontSize: fontSizes.xs, color: colors.ink, lineHeight: 16 },
  toggleCard: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  toggleTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.ink },
  toggleDesc: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 2, lineHeight: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink },
  modalSubtitle: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 4, marginBottom: spacing.md, lineHeight: 16 },
  qrImage: { width: 180, height: 180, alignSelf: 'center', marginBottom: spacing.sm },
  secretText: {
    fontSize: fontSizes.xs, color: colors.slate, textAlign: 'center', fontFamily: 'monospace',
    backgroundColor: colors.paper, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md,
  },
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
  link: { fontSize: fontSizes.sm, color: colors.slate, textDecorationLine: 'underline' },
});
