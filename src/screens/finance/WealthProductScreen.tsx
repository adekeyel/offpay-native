import AdBanner from '../../components/AdBanner';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import * as wealthApi from '../../api/wealth';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { FinanceStackParamList } from '../../navigation/MainTabNavigator';
import type { WealthProduct, WealthAccount } from '../../types/api';

type Props = NativeStackScreenProps<FinanceStackParamList, 'WealthProduct'>;

export default function WealthProductScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<WealthProduct | null>(null);
  const [account, setAccount] = useState<WealthAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [productsRes, accountsRes] = await Promise.all([wealthApi.getWealthProducts(), wealthApi.getMyWealthAccounts()]);
      const p = productsRes.data.find((x) => x.id === productId) || null;
      setProduct(p);
      navigation.setOptions({ title: p?.name || '' });
      setAccount(accountsRes.data.find((a) => a.type === p?.type) || null);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    }
  }, [productId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function openAccount() {
    if (!product) return;
    const amt = parseFloat(amount || '0');
    if (product.type === 'target' && !targetAmount) return setStatus({ type: 'error', text: 'Enter a target amount.' });

    setBusy(true);
    setStatus(null);
    try {
      await wealthApi.openWealthAccount({
        wealthProductId: product.id,
        amount: amt || undefined,
        targetAmount: product.type === 'target' ? parseFloat(targetAmount) : undefined,
      });
      setStatus({ type: 'success', text: `${product.name} account opened.` });
      setAmount('');
      await load();
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function deposit() {
    if (!account) return;
    const amt = parseFloat(amount);
    if (!amt) return setStatus({ type: 'error', text: 'Enter an amount.' });
    setBusy(true);
    setStatus(null);
    try {
      await wealthApi.depositToWealthAccount(account.id, amt);
      setStatus({ type: 'success', text: 'Deposit successful.' });
      setAmount('');
      await load();
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!account) return;
    const amt = parseFloat(amount);
    if (!amt) return setStatus({ type: 'error', text: 'Enter an amount.' });
    setBusy(true);
    setStatus(null);
    try {
      await wealthApi.withdrawFromWealthAccount(account.id, amt);
      setStatus({ type: 'success', text: 'Withdrawal successful.' });
      setAmount('');
      await load();
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (!product) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdBanner page="wealth-product" position="top" />
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <Text style={styles.rate}>{product.interest_rate}% per year{product.lock_days > 0 ? ` · ${product.lock_days}-day lock` : ' · withdraw anytime'}</Text>

        {status && <Alert type={status.type}>{status.text}</Alert>}

        {account ? (
          <View style={styles.card}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balance}>₦{Number(account.balance).toLocaleString()}</Text>
            {account.maturity_date && <Text style={styles.small}>Matures {new Date(account.maturity_date).toDateString()}</Text>}

            <Input label="Amount (₦)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title="Deposit" onPress={deposit} loading={busy} style={{ flex: 1 }} />
              <Button title="Withdraw" variant="ghost" onPress={withdraw} loading={busy} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Open this account</Text>
            {product.type === 'target' && (
              <Input label="Target amount (₦)" value={targetAmount} onChangeText={(v) => setTargetAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
            )}
            <Input label={`Opening deposit (₦, min ${Number(product.min_amount).toLocaleString()})`} value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
            <Button title="Open account" onPress={openAccount} loading={busy} />
          </View>
        )}
        <AdBanner page="wealth-product" position="bottom" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink },
  description: { fontSize: fontSizes.sm, color: colors.slate, marginTop: 6 },
  rate: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.unlock, marginTop: 6, marginBottom: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  cardTitle: { fontSize: fontSizes.base, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  balanceLabel: { fontSize: fontSizes.xs, color: colors.slate },
  balance: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.ink, marginTop: 4, marginBottom: spacing.md, fontVariant: ['tabular-nums'] },
  small: { fontSize: fontSizes.xs, color: colors.slate, marginBottom: spacing.md },
});
