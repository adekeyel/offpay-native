import AdBanner from '../../components/AdBanner';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as userApi from '../../api/user';
import * as walletApi from '../../api/wallet';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { MeStackParamList } from '../../navigation/MainTabNavigator';
import type { UserProfile, WalletSummary } from '../../types/api';

type Props = NativeStackScreenProps<MeStackParamList, 'Profile'>;

const TIER_LABEL: Record<number, string> = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

function maskDob(dob: string | null) {
  if (!dob) return 'Not provided';
  // Same masking convention as the rest of the app uses for sensitive fields — only the month is shown.
  const parts = dob.split('-'); // YYYY-MM-DD
  if (parts.length !== 3) return dob;
  return `**-${parts[1]}-**`;
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name[0] ?? ''}*@${domain}`;
}

export default function ProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      userApi.getProfile().then((res) => setProfile(res.data)).catch(() => {});
      walletApi.getWalletSummary().then((res) => setWallet(res.data)).catch(() => {});
    }, [])
  );

  const initials = profile?.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('') ?? '';
  const toggle = (key: string) => setRevealed((r) => ({ ...r, [key]: !r[key] }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdBanner page="profile" position="top" />
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.name}>{profile?.full_name ?? ''}</Text>

          <Pressable style={styles.tierPill} onPress={() => navigation.navigate('TierUpgrade')}>
            <Text style={styles.tierPillText}>🏅 {TIER_LABEL[profile?.kyc_tier ?? 1] ?? `Tier ${profile?.kyc_tier ?? 1}`}</Text>
            <Text style={styles.tierPillChevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <InfoRow label="OffPay Account Number" value={wallet?.walletId ?? '—'} copyable />
          <InfoRow
            label="Account Tier"
            value={`${TIER_LABEL[profile?.kyc_tier ?? 1] ?? `Tier ${profile?.kyc_tier ?? 1}`}`}
            onPress={() => navigation.navigate('TierUpgrade')}
            chevron
          />
        </View>

        <View style={styles.card}>
          <InfoRow label="Full Name" value={profile?.full_name ?? ''} />
          <InfoRow label="Mobile Number" value={profile?.phone ?? ''} />
          <InfoRow
            label="Gender"
            value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not provided'}
          />
          <InfoRow
            label="Date of Birth"
            value={revealed.dob ? (profile?.date_of_birth ?? 'Not provided') : maskDob(profile?.date_of_birth ?? null)}
            onPress={() => toggle('dob')}
          />
          <InfoRow
            label="Email"
            value={revealed.email ? (profile?.email ?? '') : maskEmail(profile?.email ?? '')}
            onPress={() => toggle('email')}
          />
          <InfoRow
            label="Address"
            value={revealed.address ? (profile?.address ?? 'Not provided') : 'Tap to reveal'}
            onPress={() => toggle('address')}
            last
          />
        </View>
        <AdBanner page="profile" position="bottom" />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label, value, onPress, chevron, copyable, last,
}: { label: string; value: string; onPress?: () => void; chevron?: boolean; copyable?: boolean; last?: boolean }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper style={[styles.infoRow, last && { borderBottomWidth: 0 }]} onPress={onPress}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={styles.infoValue}>{value}</Text>
        {copyable && <Text style={styles.copyIcon}>⧉</Text>}
        {chevron && <Text style={styles.chevron}>›</Text>}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.lockDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink },
  name: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, marginTop: spacing.sm },
  tierPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm,
    backgroundColor: colors.lockDim, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 14,
  },
  tierPillText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.ink },
  tierPillChevron: { fontSize: fontSizes.sm, color: colors.slate },
  divider: { height: 1, backgroundColor: colors.line, alignSelf: 'stretch', marginVertical: spacing.md },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    alignSelf: 'stretch', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  infoLabel: { fontSize: fontSizes.sm, color: colors.slate },
  infoValue: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink },
  copyIcon: { fontSize: fontSizes.xs, color: colors.slate },
  chevron: { fontSize: fontSizes.md, color: colors.slate },
});
