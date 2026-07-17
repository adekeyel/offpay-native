import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as walletApi from '../../api/wallet';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSizes } from '../../theme/colors';
import type { HomeStackParamList } from '../../navigation/MainTabNavigator';
import type { WalletSummary } from '../../types/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

const VTU_SHORTCUTS: { category: 'airtime' | 'data' | 'cable' | 'electricity'; label: string; icon: string }[] = [
  { category: 'airtime', label: 'Airtime', icon: '📶' },
  { category: 'data', label: 'Data', icon: '🌐' },
  { category: 'cable', label: 'Cable TV', icon: '📺' },
  { category: 'electricity', label: 'Electricity', icon: '⚡' },
];

export default function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const user = session.status === 'unlocked' ? session.user : null;
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await walletApi.getWalletSummary();
      setSummary(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Could not load your wallet.');
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.username}>{user?.fullName?.split(' ')[0] ?? ''}</Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <Pressable onPress={() => setBalanceVisible((v) => !v)}>
              <Text style={styles.eye}>{balanceVisible ? '🙈' : '👁'}</Text>
            </Pressable>
          </View>
          <Text style={styles.balanceAmount}>
            {summary ? (balanceVisible ? fmt(summary.confirmed) : '₦ • • • • • •') : '—'}
          </Text>
          {summary && summary.pending > 0 && (
            <Text style={styles.pendingNote}>+ {fmt(summary.pending)} pending sync (not yet spendable)</Text>
          )}
          <View style={styles.balanceBottomRow}>
            <Text style={styles.accountNumber}>{summary?.walletId ?? ''}</Text>
            <View style={styles.addMoneyBtn}><Text style={styles.addMoneyText}>+ Add Money</Text></View>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.quickActions}>
          <QuickAction icon="🏦" label="To Bank" />
          <QuickAction icon="👤" label="To OffPay User" onPress={() => navigation.navigate('SendOffline')} />
          <QuickAction icon="📥" label="Receive" onPress={() => navigation.navigate('ReceiveOffline')} />
          <QuickAction icon="💳" label="Cards" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Airtime, data & bills</Text>
          <View style={styles.serviceGrid}>
            {VTU_SHORTCUTS.map((v) => (
              <QuickAction key={v.category} icon={v.icon} label={v.label} onPress={() => navigation.navigate('VtuCategory', { category: v.category })} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress} disabled={!onPress}>
      <View style={styles.quickActionIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  greeting: { fontSize: fontSizes.xs, color: 'rgba(0,0,0,0.5)' },
  username: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, marginTop: 2 },
  balanceCard: {
    margin: spacing.lg, borderRadius: radius.xl, padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.6)' },
  eye: { fontSize: 14 },
  balanceAmount: { fontSize: 28, fontWeight: '700', color: colors.white, marginTop: 6 },
  pendingNote: { fontSize: fontSizes.xs, color: colors.lock, marginTop: 6 },
  balanceBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  accountNumber: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.6)' },
  addMoneyBtn: { backgroundColor: colors.white, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  addMoneyText: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.ink },
  errorText: { color: colors.danger, marginHorizontal: spacing.lg, fontSize: fontSizes.sm },
  quickActions: { flexDirection: 'row', paddingHorizontal: spacing.lg, justifyContent: 'space-between' },
  section: { marginTop: spacing.lg, backgroundColor: colors.white, marginHorizontal: spacing.lg, borderRadius: radius.lg, padding: spacing.lg },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  serviceGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', gap: 6, width: 70 },
  quickActionIcon: {
    width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  quickActionLabel: { fontSize: 10, fontWeight: '600', color: colors.ink700, textAlign: 'center' },
});
