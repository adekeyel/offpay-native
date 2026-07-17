import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import * as userApi from '../../api/user';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { MeStackParamList } from '../../navigation/MainTabNavigator';
import type { UserProfile } from '../../types/api';

type Props = NativeStackScreenProps<MeStackParamList, 'MeMain'>;

export default function MeScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [revealSensitive, setRevealSensitive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      userApi.getProfile().then((res) => setProfile(res.data)).catch(() => {});
    }, [])
  );

  const initials = profile?.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('') ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Me</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View>
            <Text style={styles.name}>{profile?.full_name ?? ''}</Text>
            <View style={styles.tierBadge}><Text style={styles.tierText}>KYC Tier {profile?.kyc_tier ?? 1}</Text></View>
          </View>
        </View>

        <View style={styles.infoList}>
          <InfoRow label="Email" value={profile?.email ?? ''} />
          <InfoRow label="Phone" value={profile?.phone ?? ''} />
          <InfoRow label="BVN" value={profile?.bvn ?? '—'} />
          <Pressable onPress={() => setRevealSensitive((v) => !v)}>
            <InfoRow label="Address" value={revealSensitive ? (profile?.address ?? 'Not provided') : 'Tap to reveal'} />
          </Pressable>
        </View>

        <View style={styles.menuList}>
          <MenuRow icon="📄" label="Transaction history" onPress={() => navigation.navigate('TransactionHistory')} />
          <MenuRow icon="🧾" label="Statement of account" onPress={() => navigation.navigate('Statement')} />
          <MenuRow icon="🔐" label="Settings & Security" onPress={() => {}} />
          <MenuRow icon="💬" label="Support" onPress={() => {}} />
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
  content: { padding: spacing.lg },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.lockDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink },
  name: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  tierBadge: { marginTop: 4, backgroundColor: colors.unlockDim, borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: 10, alignSelf: 'flex-start' },
  tierText: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.unlock },
  infoList: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoLabel: { fontSize: fontSizes.sm, color: colors.slate },
  infoValue: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink },
  menuList: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  menuLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink700 },
});
