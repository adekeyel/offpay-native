import AdBanner from '../../components/AdBanner';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as rewardsApi from '../../api/rewards';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { RewardsSummary } from '../../types/api';

export default function RewardsScreen() {
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      rewardsApi.getRewardsSummary().then((res) => setSummary(res.data)).catch((err) => setError(err.message));
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdBanner page="rewards" position="top" />
        <Text style={styles.title}>Rewards</Text>
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cashback balance</Text>
          <Text style={styles.statValue}>₦{(summary?.cashbackBalance ?? 0).toFixed(2)}</Text>
          <Text style={styles.statNote}>Flat ₦2 on every airtime purchase of ₦200 or more.</Text>
        </View>

        <Text style={styles.sectionLabel}>History</Text>
        {(summary?.cashbackHistory ?? []).map((h) => (
          <View key={h.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{h.source.replace('_', ' ')}</Text>
              <Text style={styles.rowDate}>{new Date(h.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.rowAmount}>+₦{Number(h.amount).toFixed(2)}</Text>
          </View>
        ))}
        {summary && summary.cashbackHistory.length === 0 && <Text style={styles.empty}>No cashback earned yet.</Text>}

        <View style={styles.placeholderCard}>
          <Text style={{ fontSize: 28 }}>🎁</Text>
          <Text style={styles.placeholderTitle}>Daily check-in & Reward Hub — coming soon</Text>
          <Text style={styles.statNote}>These aren't built yet — only cashback above is real.</Text>
        </View>
        <AdBanner page="rewards" position="bottom" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.md },
  statCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  statLabel: { fontSize: fontSizes.xs, color: colors.slate },
  statValue: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.unlock, marginTop: 4, fontVariant: ['tabular-nums'] },
  statNote: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 6 },
  sectionLabel: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.slate, textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  rowTitle: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink, textTransform: 'capitalize' },
  rowDate: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 2 },
  rowAmount: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.unlock },
  empty: { fontSize: fontSizes.sm, color: colors.slate },
  placeholderCard: { alignItems: 'center', marginTop: spacing.xl, padding: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg },
  placeholderTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.ink, marginTop: spacing.sm, textAlign: 'center' },
});
