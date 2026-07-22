import AdBanner from '../../components/AdBanner';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as walletApi from '../../api/wallet';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { Transaction } from '../../types/api';

export default function TransactionHistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      walletApi.getTransactionHistory(100).then((res) => setTransactions(res.data)).catch((err) => setError(err.message));
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.narration} numberOfLines={1}>{item.narration}</Text>
              <Text style={styles.meta}>{item.reference} · {new Date(item.created_at).toLocaleString()}</Text>
            </View>
            <Text style={[styles.amount, item.direction === 'credit' ? styles.credit : styles.debit]}>
              {item.direction === 'credit' ? '+' : '−'}₦{Number(item.amount).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
        ListHeaderComponent={<AdBanner page="transaction-history" position="top" />}
        ListFooterComponent={<AdBanner page="transaction-history" position="bottom" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  error: { color: colors.danger, padding: spacing.lg },
  row: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center' },
  narration: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink },
  meta: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 2 },
  amount: { fontSize: fontSizes.sm, fontWeight: '700' },
  credit: { color: colors.unlock },
  debit: { color: colors.ink },
  empty: { textAlign: 'center', color: colors.slate, marginTop: spacing.xl },
});
