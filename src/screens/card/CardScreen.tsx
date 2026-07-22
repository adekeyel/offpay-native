import AdBanner from '../../components/AdBanner';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import * as walletApi from '../../api/wallet';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { Card } from '../../types/api';

const STATUS_LABEL: Record<string, string> = { active: 'Active', frozen: 'Frozen', blocked: 'Blocked', expired: 'Expired' };

export default function CardScreen() {
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await walletApi.getMyCard();
      setCard(res.data);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    setBusy(true);
    setStatus(null);
    try {
      await walletApi.createCard();
      setStatus({ type: 'success', text: 'Your virtual card is ready.' });
      await load();
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function act(action: 'freeze' | 'unfreeze' | 'block') {
    if (!card) return;
    setBusy(true);
    setStatus(null);
    try {
      await walletApi.updateCardStatus(card.id, action);
      await load();
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdBanner page="card" position="top" />
        <Text style={styles.title}>Card</Text>
        {status && <Alert type={status.type}>{status.text}</Alert>}

        {card === undefined && <Text style={styles.subtitle}>Loading…</Text>}

        {card === null && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40 }}>💳</Text>
            <Text style={styles.emptyTitle}>Get a virtual card</Text>
            <Text style={styles.subtitle}>Spend online anywhere Verve is accepted, funded straight from your OffPay wallet.</Text>
            <Button title="Create virtual card" onPress={create} loading={busy} style={{ marginTop: spacing.md }} />
          </View>
        )}

        {card && (
          <View>
            <View style={styles.cardVisual}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardBrandName}>Off<Text style={{ color: colors.unlock }}>Pay</Text></Text>
                <Text style={styles.cardBrandTag}>{card.brand.toUpperCase()}</Text>
              </View>
              <Text style={styles.pan}>{card.masked_pan}</Text>
              <View style={styles.cardBottomRow}>
                <Text style={styles.cardMeta}>Expires {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}</Text>
                <Text style={styles.cardStatusBadge}>{STATUS_LABEL[card.status]}</Text>
              </View>
            </View>

            <Text style={styles.note}>
              For your security, the full card number and CVV are only ever shown once by our card
              partner directly — we don't store or display them here after that.
            </Text>

            <View style={styles.actionsRow}>
              {card.status === 'active' && <Button title="Freeze card" variant="ghost" onPress={() => act('freeze')} loading={busy} />}
              {card.status === 'frozen' && <Button title="Unfreeze card" variant="ghost" onPress={() => act('unfreeze')} loading={busy} />}
              {card.status !== 'blocked' && card.status !== 'expired' && (
                <Button title="Block permanently" variant="danger" onPress={() => act('block')} loading={busy} />
              )}
            </View>
          </View>
        )}
        <AdBanner page="card" position="bottom" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  subtitle: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginTop: 6 },
  emptyState: { alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.lg },
  emptyTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink, marginTop: spacing.sm },
  cardVisual: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardBrandName: { fontSize: fontSizes.md, fontWeight: '700', color: colors.white },
  cardBrandTag: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.6)' },
  pan: { fontSize: fontSizes.lg, letterSpacing: 2, color: colors.white, marginTop: spacing.xl, fontVariant: ['tabular-nums'] },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  cardMeta: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)' },
  cardStatusBadge: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.white },
  note: { fontSize: fontSizes.xs, color: colors.slate, marginTop: spacing.md, lineHeight: 16 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
});
