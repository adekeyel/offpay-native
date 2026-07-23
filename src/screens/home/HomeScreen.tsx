import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as walletApi from '../../api/wallet';
import { useAuth } from '../../context/AuthContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { setCachedOfflineToken } from '../../auth/secureStorage';
import AdBanner from '../../components/AdBanner';
import AppFooter from '../../components/AppFooter';
import AppHeader from '../../components/AppHeader';
import NotificationBell from '../../components/NotificationBell';
import { colors, spacing, radius, fontSizes } from '../../theme/colors';
import type { HomeStackParamList } from '../../navigation/MainTabNavigator';
import type { WalletSummary, Transaction } from '../../types/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

const VTU_SHORTCUTS: { category: 'airtime' | 'data' | 'cable' | 'electricity'; label: string; icon: string }[] = [
  { category: 'airtime', label: 'Airtime', icon: '📶' },
  { category: 'data', label: 'Data', icon: '🌐' },
  { category: 'cable', label: 'Cable TV', icon: '📺' },
  { category: 'electricity', label: 'Electricity', icon: '⚡' },
];

export default function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const user = session.status === 'unlocked' ? session.user : null;
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  // Hidden is the default/primary state — the eye icon is how the user
  // opts into showing it, not the other way around.
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [recentTxn, setRecentTxn] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showingCached, setShowingCached] = useState(false);

  const load = useCallback(async () => {
    try {
      const res: any = await walletApi.getWalletSummary();
      setSummary(res.data);
      setShowingCached(Boolean(res.fromCache));
      setError(null);
      if (!res.fromCache) {
        // We're genuinely online right now (this wasn't served from cache) —
        // opportunistically refresh the offline-spend token in the
        // background so "Send (offline)" doesn't ask the user to connect
        // the moment they open it after losing signal. Best-effort: if it
        // fails (e.g. KYC not approved yet), Send (offline) still has its
        // own fallback logic.
        walletApi
          .prepareOfflineMode()
          .then((r) => setCachedOfflineToken({ token: r.data.token, offlineLimit: r.data.offlineLimit, expiresAt: r.data.expiresAt }))
          .catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Could not load your wallet.');
    }
    // Independent of the summary call above — a failure here shouldn't
    // block the balance card from showing, so it's caught on its own.
    walletApi.getTransactionHistory(1).then((res) => setRecentTxn(res.data[0] || null)).catch(() => {});
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
        <AppHeader
          right={
            <View style={styles.headerActions}>
              <Pressable
                hitSlop={10}
                style={styles.headerIconBtn}
                onPress={() => navigation.getParent()?.navigate('Me' as never, { screen: 'SettingsSecurity' } as never)}
              >
                <Text style={styles.headerIcon}>⚙️</Text>
              </Pressable>
              <NotificationBell onPress={() => navigation.navigate('Notifications')} />
            </View>
          }
        />
        <AdBanner page="dashboard" position="top" />
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
            <Pressable style={styles.addMoneyBtn} onPress={() => navigation.navigate('AddMoney')}>
              <Text style={styles.addMoneyText}>+ Add Money</Text>
            </Pressable>
          </View>
        </View>

        {recentTxn && (
          <Pressable
            style={styles.recentCard}
            onPress={() => navigation.getParent()?.navigate('Me' as never, { screen: 'TransactionHistory' } as never)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.recentLabel}>Most recent</Text>
              <Text style={styles.recentNarration} numberOfLines={1}>{recentTxn.narration}</Text>
            </View>
            <Text style={[styles.recentAmount, recentTxn.direction === 'credit' ? styles.recentCredit : styles.recentDebit]}>
              {recentTxn.direction === 'credit' ? '+' : '−'}₦{Number(recentTxn.amount).toLocaleString()}
            </Text>
            <Text style={styles.recentChevron}>›</Text>
          </Pressable>
        )}

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              {showingCached ? "You're offline — showing your last synced data." : "You're offline."}
            </Text>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.quickActions}>
          <QuickAction icon="🏦" label="To Bank" onPress={() => navigation.navigate('BankTransfer')} />
          <QuickAction icon="👤" label="To OffPay User" onPress={() => navigation.navigate('SendToUserChooser')} />
          <QuickAction icon="📥" label="Receive" onPress={() => navigation.navigate('ReceiveOffline')} />
          <QuickAction icon="💳" label="Cards" onPress={() => navigation.getParent()?.navigate('Card' as never)} />
        </View>

        <AdBanner page="dashboard" position="middle" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Airtime, data & bills</Text>
          <View style={styles.serviceGrid}>
            {VTU_SHORTCUTS.map((v) => (
              <QuickAction key={v.category} icon={v.icon} label={v.label} onPress={() => navigation.navigate('VtuCategory', { category: v.category })} />
            ))}
          </View>
        </View>
        <AdBanner page="dashboard" position="bottom" />
        <AppFooter />
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconBtn: { padding: 4 },
  headerIcon: { fontSize: 18 },
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
  recentCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: -spacing.sm, marginBottom: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  recentLabel: { fontSize: 10, color: colors.slate, fontWeight: '600' },
  recentNarration: { fontSize: fontSizes.sm, color: colors.ink, fontWeight: '600', marginTop: 1 },
  recentAmount: { fontSize: fontSizes.sm, fontWeight: '700', marginLeft: spacing.sm },
  recentCredit: { color: colors.unlock },
  recentDebit: { color: colors.ink },
  recentChevron: { fontSize: fontSizes.lg, color: colors.slate, marginLeft: spacing.xs },
  errorText: { color: colors.danger, marginHorizontal: spacing.lg, fontSize: fontSizes.sm },
  offlineBanner: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.lockDim, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12 },
  offlineBannerText: { color: colors.ink700, fontSize: fontSizes.xs, fontWeight: '600' },
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
