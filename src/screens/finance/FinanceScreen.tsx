import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import Input from '../../components/Input';
import * as loanApi from '../../api/loans';
import * as wealthApi from '../../api/wealth';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { FinanceStackParamList } from '../../navigation/MainTabNavigator';
import type { LoanProduct, Loan, WealthProduct, WealthAccount } from '../../types/api';

type Props = NativeStackScreenProps<FinanceStackParamList, 'FinanceMain'>;
type SubTab = 'loan' | 'wealth';

export default function FinanceScreen({ navigation }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('wealth');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finance</Text>
        <View style={styles.subtabs}>
          <Pressable style={[styles.subtab, subTab === 'loan' && styles.subtabActive]} onPress={() => setSubTab('loan')}>
            <Text style={[styles.subtabText, subTab === 'loan' && styles.subtabTextActive]}>Loan</Text>
          </Pressable>
          <Pressable style={[styles.subtab, subTab === 'wealth' && styles.subtabActive]} onPress={() => setSubTab('wealth')}>
            <Text style={[styles.subtabText, subTab === 'wealth' && styles.subtabTextActive]}>Wealth</Text>
          </Pressable>
        </View>
      </View>
      {subTab === 'loan' ? <LoanTab /> : <WealthTab navigation={navigation} />}
    </SafeAreaView>
  );
}

function LoanTab() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [activeLoan, setActiveLoan] = useState<Loan | null | undefined>(undefined);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [productsRes, activeRes] = await Promise.all([loanApi.getLoanProducts(), loanApi.getActiveLoan()]);
      setProducts(productsRes.data);
      setActiveLoan(activeRes.data);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function request() {
    if (!selectedProduct) return;
    const amt = parseFloat(amount);
    if (!amt) return setStatus({ type: 'error', text: 'Enter an amount.' });
    setBusy(true);
    setStatus(null);
    try {
      const res = await loanApi.requestLoan(selectedProduct.id, amt);
      setStatus({ type: 'success', text: res.message });
      setSelectedProduct(null);
      setAmount('');
      await load();
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function repay(repayAmount: number) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await loanApi.repayLoan(repayAmount);
      setStatus({ type: 'success', text: res.message });
      await load();
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {status && <Alert type={status.type}>{status.text}</Alert>}

      {activeLoan && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{activeLoan.product_name}</Text>
          <Text style={styles.bigAmount}>₦{Number(activeLoan.total_repayable).toLocaleString()}</Text>
          <Text style={styles.small}>
            ₦{Number(activeLoan.amount_repaid).toLocaleString()} repaid · due {new Date(activeLoan.due_date).toDateString()}
          </Text>
          {(activeLoan.status === 'active' || activeLoan.status === 'defaulted') && (
            <Button
              title="Repay remaining balance"
              onPress={() => repay(Number(activeLoan.total_repayable) - Number(activeLoan.amount_repaid))}
              loading={busy}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>
      )}

      {!activeLoan && !selectedProduct && (
        <>
          <Text style={styles.sectionLabel}>Available loans</Text>
          {products.map((p) => (
            <Pressable key={p.id} style={styles.productRow} disabled={!p.eligibility.eligible} onPress={() => setSelectedProduct(p)}>
              <View>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.small}>₦{Number(p.min_amount).toLocaleString()} – ₦{Number(p.max_amount).toLocaleString()} · {p.interest_rate}% · {p.tenor_days} days</Text>
                {!p.eligibility.eligible && <Text style={styles.ineligible}>{p.eligibility.reason}</Text>}
              </View>
            </Pressable>
          ))}
        </>
      )}

      {!activeLoan && selectedProduct && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selectedProduct.name}</Text>
          <Input label="Amount (₦)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
          <Button title="Request loan" onPress={request} loading={busy} />
          <Pressable onPress={() => setSelectedProduct(null)} style={{ marginTop: spacing.sm }}>
            <Text style={styles.link}>Choose a different product</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function WealthTab({ navigation }: { navigation: Props['navigation'] }) {
  const [products, setProducts] = useState<WealthProduct[]>([]);
  const [accounts, setAccounts] = useState<WealthAccount[]>([]);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [productsRes, accountsRes] = await Promise.all([wealthApi.getWealthProducts(), wealthApi.getMyWealthAccounts()]);
      setProducts(productsRes.data);
      setAccounts(accountsRes.data);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {status && <Alert type={status.type}>{status.text}</Alert>}

      {accounts.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Your savings</Text>
          {accounts.map((a) => (
            <View key={a.id} style={styles.card}>
              <Text style={styles.cardTitle}>{a.product_name}</Text>
              <Text style={styles.bigAmount}>₦{Number(a.balance).toLocaleString()}</Text>
              <Text style={styles.small}>{a.interest_rate}% p.a. {a.maturity_date ? `· matures ${new Date(a.maturity_date).toDateString()}` : ''}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionLabel}>Products</Text>
      {products.map((p) => (
        <Pressable key={p.id} style={styles.productRow} onPress={() => navigation.navigate('WealthProduct', { productId: p.id })}>
          <Text style={styles.productName}>{p.name}</Text>
          <Text style={styles.small}>{p.description}</Text>
          <Text style={styles.small}>{p.interest_rate}% p.a. · min ₦{Number(p.min_amount).toLocaleString()}{p.lock_days > 0 ? ` · ${p.lock_days}-day lock` : ''}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { padding: spacing.lg, paddingBottom: 0 },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink },
  subtabs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  subtab: { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center' },
  subtabActive: { backgroundColor: colors.ink },
  subtabText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.slate },
  subtabTextActive: { color: colors.white },
  tabContent: { padding: spacing.lg },
  sectionLabel: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.slate, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSizes.base, fontWeight: '700', color: colors.ink },
  bigAmount: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.ink, marginTop: 6, fontVariant: ['tabular-nums'] },
  small: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 4 },
  ineligible: { fontSize: fontSizes.xs, color: colors.danger, marginTop: 4 },
  productRow: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  productName: { fontSize: fontSizes.base, fontWeight: '600', color: colors.ink },
  link: { fontSize: fontSizes.sm, color: colors.slate, textDecorationLine: 'underline', textAlign: 'center' },
});
