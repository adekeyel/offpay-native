import AdBanner from '../../components/AdBanner';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import * as walletApi from '../../api/wallet';
import { colors, spacing, fontSizes } from '../../theme/colors';
import type { HomeStackParamList } from '../../navigation/MainTabNavigator';
import type { VtuProduct } from '../../types/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'VtuCategory'>;

const META: Record<string, { title: string; recipientLabel: string; recipientPlaceholder: string; freeAmount: boolean }> = {
  airtime: { title: 'Buy airtime', recipientLabel: 'Phone number', recipientPlaceholder: '080XXXXXXXX', freeAmount: true },
  data: { title: 'Buy data', recipientLabel: 'Phone number', recipientPlaceholder: '080XXXXXXXX', freeAmount: false },
  cable: { title: 'Cable TV subscription', recipientLabel: 'Smartcard / IUC number', recipientPlaceholder: 'e.g. 1234567890', freeAmount: false },
  electricity: { title: 'Buy electricity', recipientLabel: 'Meter number', recipientPlaceholder: 'e.g. 04512345678', freeAmount: true },
};

export default function VtuCategoryScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const meta = META[category];

  const [providers, setProviders] = useState<string[]>([]);
  const [plans, setPlans] = useState<VtuProduct[]>([]);
  const [provider, setProvider] = useState('');
  const [productId, setProductId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: meta.title });
    walletApi.getVtuProducts(category).then((res) => {
      setProviders(res.data.providers);
      setPlans(res.data.plans);
      if (res.data.providers.length) setProvider(res.data.providers[0]);
    }).catch((err) => setStatus({ type: 'error', text: err.message }));
  }, [category]);

  const providerPlans = plans.filter((p) => p.provider === provider);

  async function submit() {
    setStatus(null);
    setLoading(true);
    try {
      const body: any = { category, provider, recipient };
      if (meta.freeAmount) body.amount = parseFloat(amount);
      else body.productId = productId;

      const res = await walletApi.purchaseVtu(body);
      setStatus({ type: 'success', text: res.message });
      setRecipient('');
      setAmount('');
      setProductId('');
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdBanner page="vtu-category" position="top" />
        <Text style={styles.label}>Provider</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={provider} onValueChange={(v) => { setProvider(v); setProductId(''); }}>
            {providers.map((p) => <Picker.Item key={p} label={p} value={p} />)}
          </Picker>
        </View>

        <Input label={meta.recipientLabel} placeholder={meta.recipientPlaceholder} value={recipient} onChangeText={setRecipient} keyboardType="phone-pad" />

        {meta.freeAmount ? (
          <Input label="Amount (₦)" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
        ) : (
          <>
            <Text style={styles.label}>Plan</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={productId} onValueChange={setProductId}>
                <Picker.Item label="Select a plan…" value="" />
                {providerPlans.map((p) => <Picker.Item key={p.id} label={`${p.name} — ₦${Number(p.amount).toLocaleString()}`} value={p.id} />)}
              </Picker>
            </View>
          </>
        )}

        {status && <Alert type={status.type}>{status.text}</Alert>}
        <Button title="Pay" onPress={submit} loading={loading} />
        <AdBanner page="vtu-category" position="bottom" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  pickerWrap: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, marginBottom: spacing.md, backgroundColor: colors.white },
});
