import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import * as offlineTransferApi from '../../api/offlineTransfer';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { OfflineVoucher } from '../../types/api';

/**
 * Shows this user's own ID as a QR code — deliberately requires NO network
 * call to render, since the whole point is that a receiver with zero
 * connectivity can still show this and receive an offline transfer.
 */
export default function ReceiveOfflineScreen() {
  const { session } = useAuth();
  const user = session.status === 'unlocked' ? session.user : null;
  const [pending, setPending] = useState<OfflineVoucher[]>([]);

  useFocusEffect(
    useCallback(() => {
      // Best-effort only — if there's no connectivity this simply fails
      // silently and the QR above still works fine for receiving.
      offlineTransferApi.getOfflineTransferHistory()
        .then((res) => setPending(res.data.filter((v) => v.status === 'pending_sync' && v.receiver_id === user?.id)))
        .catch(() => {});
    }, [user?.id])
  );

  if (!user) return null;
  const qrPayload = JSON.stringify({ userId: user.id, fullName: user.fullName });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Show this to the sender</Text>
        <Text style={styles.subtitle}>
          They'll scan this to identify your account — works with no internet connection on
          either device.
        </Text>

        <View style={styles.qrBox}>
          <QRCode value={qrPayload} size={220} color={colors.ink} backgroundColor={colors.white} />
        </View>
        <Text style={styles.name}>{user.fullName}</Text>

        {pending.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.pendingTitle}>Pending sync</Text>
            {pending.map((v) => (
              <View key={v.id} style={styles.pendingRow}>
                <Text style={styles.pendingAmount}>₦{Number(v.amount).toLocaleString()}</Text>
                <Text style={styles.pendingNote}>from {v.sender_name ?? 'a sender'} — awaiting their sync</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, alignItems: 'center' },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginTop: 6, marginBottom: spacing.xl, lineHeight: 18 },
  qrBox: { padding: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  name: { marginTop: spacing.md, fontSize: fontSizes.base, fontWeight: '600', color: colors.ink },
  pendingSection: { marginTop: spacing.xl, width: '100%' },
  pendingTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.slate, marginBottom: spacing.sm },
  pendingRow: { backgroundColor: colors.lockDim, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  pendingAmount: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink },
  pendingNote: { fontSize: fontSizes.xs, color: colors.ink700, marginTop: 2 },
});
