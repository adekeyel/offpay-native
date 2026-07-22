import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import { receiptUrl } from '../../api/wallet';
import { getAccessToken } from '../../api/client';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { MeStackParamList } from '../../navigation/MainTabNavigator';

type Props = NativeStackScreenProps<MeStackParamList, 'TransactionDetail'>;

const TYPE_LABELS: Record<string, string> = {
  deposit_external: 'Bank deposit',
  withdrawal_external: 'Bank transfer',
  send_in_app: 'Sent to OffPay user',
  receive_in_app: 'Received from OffPay user',
  offline_send: 'Offline transfer sent',
  offline_receive: 'Offline transfer received',
  vtu_purchase: 'Airtime/Data/Bills',
  card_funding: 'Card funding',
  reversal: 'Reversal',
  admin_credit: 'Manual credit',
  admin_debit: 'Manual debit',
};

function typeLabel(type: string) {
  return TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(status: string) {
  if (status === 'success') return colors.unlock;
  if (status === 'pending') return colors.lock;
  if (status === 'failed' || status === 'reversed') return colors.danger;
  return colors.slate;
}

function fmtMoney(n: string | number) {
  return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function TransactionDetailScreen({ route }: Props) {
  const { transaction: txn } = route.params;
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [sharing, setSharing] = useState(false);

  const isCredit = txn.direction === 'credit';
  const hasCounterparty = Boolean(txn.counterparty_name || txn.counterparty_bank || txn.counterparty_number);
  const counterpartyLabel = isCredit ? 'From' : 'To';

  async function shareReceipt() {
    setStatus(null);
    setSharing(true);
    try {
      const token = getAccessToken();
      const destination = new File(Paths.cache, `OffPay-Receipt-${txn.reference}.pdf`);
      const file = await File.downloadFileAsync(receiptUrl(txn.id), destination, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: `OffPay Receipt — ${txn.reference}` });
      } else {
        setStatus({ type: 'success', text: `Saved to ${file.uri}` });
      }
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Could not prepare the receipt.' });
    } finally {
      setSharing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.amountCard}>
          <Text style={styles.typeLabel}>{typeLabel(txn.type)}</Text>
          <Text style={[styles.amount, { color: isCredit ? colors.unlock : colors.ink }]}>
            {isCredit ? '+' : '−'}{fmtMoney(txn.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(txn.status) + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor(txn.status) }]}>{txn.status.toUpperCase()}</Text>
          </View>
        </View>

        {hasCounterparty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{counterpartyLabel}</Text>
            {txn.counterparty_name && <DetailRow label="Name" value={txn.counterparty_name} />}
            {txn.counterparty_bank && <DetailRow label="Bank" value={txn.counterparty_bank} />}
            {txn.counterparty_number && <DetailRow label="Account number" value={txn.counterparty_number} />}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction details</Text>
          <DetailRow label="Reference" value={txn.reference} copyable />
          {txn.provider_reference && <DetailRow label="Provider reference" value={txn.provider_reference} copyable />}
          <DetailRow label="Date & time" value={new Date(txn.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'medium' })} />
          <DetailRow label="Amount" value={fmtMoney(txn.amount)} />
          <DetailRow label="Fee" value={fmtMoney(txn.fee)} />
          <DetailRow label="Balance before" value={fmtMoney(txn.balance_before)} />
          <DetailRow label="Balance after" value={fmtMoney(txn.balance_after)} />
          {txn.provider && <DetailRow label="Processed via" value={txn.provider} />}
          {txn.narration && <DetailRow label="Narration" value={txn.narration} />}
        </View>

        {status && <Alert type={status.type}>{status.text}</Alert>}
        <Button title="Share receipt" onPress={shareReceipt} loading={sharing} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  // Copy-to-clipboard is a nice-to-have for reference numbers during
  // reconciliation, but isn't wired to a clipboard call here to avoid
  // pulling in a new dependency — the value is still fully visible and
  // selectable via long-press on most devices.
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  amountCard: {
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  typeLabel: { fontSize: fontSizes.sm, color: colors.slate, fontWeight: '600' },
  amount: { fontSize: 28, fontWeight: '800', marginTop: spacing.xs },
  statusBadge: { marginTop: spacing.sm, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 12 },
  statusText: { fontSize: fontSizes.xs, fontWeight: '700' },
  section: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.slate, textTransform: 'uppercase', marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line, gap: spacing.md },
  rowLabel: { fontSize: fontSizes.sm, color: colors.slate },
  rowValue: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink, flexShrink: 1, textAlign: 'right' },
});
