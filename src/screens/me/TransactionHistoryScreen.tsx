import AdBanner from '../../components/AdBanner';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as walletApi from '../../api/wallet';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { MeStackParamList } from '../../navigation/MainTabNavigator';
import type { Transaction } from '../../types/api';

type Props = NativeStackScreenProps<MeStackParamList, 'TransactionHistory'>;

export default function TransactionHistoryScreen({ navigation }: Props) {
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
        renderItem={({ item }) => {
          const counterparty = item.counterparty_name || item.counterparty_number;
          return (
            <Pressable style={styles.row} onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.narration} numberOfLines={1}>{item.narration}</Text>
                {counterparty ? (
                  <Text style={styles.counterparty} numberOfLines={1}>
                    {item.direction === 'credit' ? 'From ' : 'To '}{counterparty}
                  </Text>
                ) : null}
                <Text style={styles.meta}>{item.reference} · {new Date(item.created_at).toLocaleString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, item.direction === 'credit' ? styles.credit : styles.debit]}>
                  {item.direction === 'credit' ? '+' : '−'}₦{Number(item.amount).toLocaleString()}
                </Text>
                {item.status !== 'success' && <Text style={styles.statusTag}>{item.status.toUpperCase()}</Text>}
              </View>
            </Pressable>
          );
        }}
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
  counterparty: { fontSize: fontSizes.xs, color: colors.ink700, marginTop: 1 },
  meta: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 2 },
  amount: { fontSize: fontSizes.sm, fontWeight: '700' },
  credit: { color: colors.unlock },
  debit: { color: colors.ink },
  statusTag: { fontSize: 9, fontWeight: '700', color: colors.lock, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.slate, marginTop: spacing.xl },
});
