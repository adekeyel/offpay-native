import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system/next';
import { useFocusEffect } from '@react-navigation/native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import AppFooter from '../../components/AppFooter';
import * as userApi from '../../api/user';
import { withPickerSession } from '../../utils/pickerSession';
import { colors, spacing, fontSizes } from '../../theme/colors';
import type { UserProfile } from '../../types/api';

export default function TierUpgradeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nin, setNin] = useState('');
  const [address, setAddress] = useState('');
  const [ninSlipUri, setNinSlipUri] = useState<string | null>(null);
  const [utilityBillUri, setUtilityBillUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      userApi.getProfile().then((res) => setProfile(res.data)).catch(() => {});
    }, [])
  );

  async function pickImage(setter: (uri: string) => void) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to attach this document.');
      return;
    }
    const result = await withPickerSession(() =>
      ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
    );
    if (!result.canceled) setter(result.assets[0].uri);
  }

  const movingToTier = profile ? profile.kyc_tier + 1 : null;

  async function submit() {
    setError(null);
    setSuccess(null);

    if (movingToTier === 2) {
      if (!/^\d{11}$/.test(nin)) return setError('NIN must be exactly 11 digits.');
      if (!address.trim()) return setError('Address is required.');
      if (!ninSlipUri) return setError('A photo of your NIN slip is required.');
    } else {
      if (!utilityBillUri) return setError('A photo of a recent utility bill is required.');
    }

    setLoading(true);
    try {
      const fd = new FormData();
      if (movingToTier === 2) {
        fd.append('nin', nin);
        fd.append('address', address);
        // Same File-append pattern used for the passport upload at registration —
        // the plain { uri, name, type } object form isn't supported here.
        fd.append('ninSlip', new File(ninSlipUri!), 'nin-slip.jpg');
      } else {
        fd.append('utilityBill', new File(utilityBillUri!), 'utility-bill.jpg');
      }

      const res = await userApi.requestTierUpgrade(fd);
      setSuccess(res.message);
    } catch (err: any) {
      setError(err.message || 'Could not submit your request.');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) return <SafeAreaView style={styles.container} />;

  if (profile.kyc_status !== 'approved') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Alert type="info">
            Complete your initial identity verification first — a tier upgrade builds on top of that. Once your
            account shows as verified, come back here to request a higher tier.
          </Alert>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (profile.kyc_tier >= 3) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Alert type="success">You're already at the highest verification tier.</Alert>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  if (profile.tier_upgrade_status === 'pending') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Alert type="info">
            Your tier upgrade request is pending review. This is usually reviewed within 24-48 hours.
          </Alert>
        </View>
        <AppFooter />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {movingToTier === 2 ? 'Upgrade to Tier 2' : 'Upgrade to Tier 3'}
        </Text>
        <Text style={styles.subtitle}>
          {movingToTier === 2
            ? 'Tier 2 unlocks higher limits and needs your NIN plus a photo of your NIN slip.'
            : 'Tier 3 is our highest limit tier and needs a recent utility bill matching the address on file from your Tier 2 verification.'}
        </Text>

        {profile.tier_upgrade_status === 'rejected' && profile.tier_upgrade_notes && (
          <Alert type="error">{`Your last request was rejected: ${profile.tier_upgrade_notes}. You can resubmit below.`}</Alert>
        )}
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {!success && movingToTier === 2 && (
          <>
            <Input
              label="National Identification Number (NIN)"
              value={nin}
              onChangeText={(v) => setNin(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={11}
            />
            <Input label="Residential address" value={address} onChangeText={setAddress} multiline />

            <Text style={styles.label}>NIN slip</Text>
            {ninSlipUri ? <Image source={{ uri: ninSlipUri }} style={styles.preview} /> : null}
            <Button
              title={ninSlipUri ? 'Change photo' : 'Attach NIN slip'}
              variant="ghost"
              onPress={() => pickImage(setNinSlipUri)}
              style={{ marginBottom: spacing.lg }}
            />

            <Button title="Submit request" onPress={submit} loading={loading} />
          </>
        )}

        {!success && movingToTier === 3 && (
          <>
            <View style={styles.addressOnFile}>
              <Text style={styles.label}>Address on file (from Tier 2)</Text>
              <Text style={styles.addressText}>{profile.address}</Text>
            </View>

            <Text style={styles.label}>Recent utility bill</Text>
            {utilityBillUri ? <Image source={{ uri: utilityBillUri }} style={styles.preview} /> : null}
            <Button
              title={utilityBillUri ? 'Change photo' : 'Attach utility bill'}
              variant="ghost"
              onPress={() => pickImage(setUtilityBillUri)}
              style={{ marginBottom: spacing.lg }}
            />

            <Button title="Submit request" onPress={submit} loading={loading} />
          </>
        )}
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: fontSizes.base, color: colors.slate, marginTop: 4, marginBottom: spacing.lg },
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  preview: { width: 120, height: 90, borderRadius: 12, marginBottom: spacing.sm },
  addressOnFile: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg },
  addressText: { fontSize: fontSizes.base, color: colors.slate, marginTop: 2 },
});
