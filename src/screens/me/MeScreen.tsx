import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import * as userApi from '../../api/user';
import AppHeader from '../../components/AppHeader';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { MeStackParamList } from '../../navigation/MainTabNavigator';
import type { UserProfile } from '../../types/api';

type Props = NativeStackScreenProps<MeStackParamList, 'MeMain'>;

export default function MeScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      userApi.getProfile().then((res) => setProfile(res.data)).catch(() => {});
    }, [])
  );

  const initials = profile?.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('') ?? '';
  const tier = profile?.kyc_tier ?? 1;
  const upgradeStatus = profile?.tier_upgrade_status ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader right={<Pressable hitSlop={8}><Text style={{ fontSize: 20 }}>⚙️</Text></Pressable>} />

        <Pressable style={styles.profileHeader} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.full_name ?? ''}</Text>
            <View style={styles.tierRow}>
              <View style={styles.tierBadge}><Text style={styles.tierText}>Tier {tier}</Text></View>
              {upgradeStatus === 'pending' && (
                <View style={[styles.tierBadge, styles.pendingBadge]}><Text style={styles.pendingText}>Upgrade pending</Text></View>
              )}
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {tier < 3 && upgradeStatus !== 'pending' && (
          <Pressable style={styles.upgradeBanner} onPress={() => navigation.navigate('TierUpgrade')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>
                {upgradeStatus === 'rejected' ? 'Resubmit your tier upgrade' : `Unlock higher limits — go to Tier ${tier + 1}`}
              </Text>
              <Text style={styles.upgradeSubtitle}>
                {upgradeStatus === 'rejected'
                  ? 'Your last request needs a fix. Tap to see why and try again.'
                  : 'Verify your NIN and address to raise your daily transfer & balance limits.'}
              </Text>
            </View>
            <View style={styles.upgradeCta}><Text style={styles.upgradeCtaText}>Upgrade</Text></View>
          </Pressable>
        )}

        {tier < 3 && upgradeStatus === 'pending' && (
          <View style={[styles.upgradeBanner, styles.upgradeBannerPending]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Tier upgrade under review</Text>
              <Text style={styles.upgradeSubtitle}>We're checking your documents. This usually takes 24–48 hours.</Text>
            </View>
          </View>
        )}

        <View style={styles.infoList}>
          <InfoRow label="Email" value={profile?.email ?? ''} />
          <InfoRow label="Phone" value={profile?.phone ?? ''} />
        </View>

        <View style={styles.menuList}>
          <MenuRow icon="📄" label="Transaction history" onPress={() => navigation.navigate('TransactionHistory')} />
          <MenuRow icon="🧾" label="Statement of account" onPress={() => navigation.navigate('Statement')} />
          <MenuRow icon="🔐" label="Settings & Security" onPress={() => navigation.navigate('SettingsSecurity')} />
          <MenuRow icon="💬" label="Support" onPress={() => navigation.navigate('Support')} />
          <MenuRow icon="↪" label="Log out" onPress={logout} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: spacing.lg },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.lockDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink },
  name: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  chevron: { fontSize: fontSizes.lg, color: colors.slate },
  tierBadge: { marginTop: 4, backgroundColor: colors.unlockDim, borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: 10, alignSelf: 'flex-start' },
  tierText: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.unlock },
  tierRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  pendingBadge: { backgroundColor: colors.lockDim },
  pendingText: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.lock },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.ink, borderRadius: radius.lg, padding: spacing.md,
  },
  upgradeBannerPending: { backgroundColor: colors.ink600 },
  upgradeTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.white },
  upgradeSubtitle: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  upgradeCta: { backgroundColor: colors.unlock, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  upgradeCtaText: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.white },
  infoList: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoLabel: { fontSize: fontSizes.sm, color: colors.slate },
  infoValue: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink },
  menuList: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', marginHorizontal: spacing.lg },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  menuLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink700 },
});
