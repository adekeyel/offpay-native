import AdBanner from '../../components/AdBanner';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import AppFooter from '../../components/AppFooter';
import { downloadStatementUrl } from '../../api/wallet';
import { getAccessToken } from '../../api/client';
import { colors, spacing, fontSizes } from '../../theme/colors';

export default function StatementScreen() {
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function download() {
    setStatus(null);
    setLoading(true);
    try {
      const token = getAccessToken();
      const destination = new File(Paths.cache, `OffPay-Statement-${Date.now()}.pdf`);
      const file = await File.downloadFileAsync(downloadStatementUrl(), destination, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'OffPay Statement of Account' });
      } else {
        setStatus({ type: 'success', text: `Saved to ${file.uri}` });
      }
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Could not download the statement.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AdBanner page="statement" position="top" />
        <Text style={{ fontSize: 40 }}>🧾</Text>
        <Text style={styles.title}>Statement of Account</Text>
        <Text style={styles.subtitle}>
          Downloads a PDF covering your last 30 days of activity, including your name and address
          on file.
        </Text>
        {status && <Alert type={status.type}>{status.text}</Alert>}
        <Button title="Download statement" onPress={download} loading={loading} />
        <AdBanner page="statement" position="bottom" />
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, marginTop: spacing.sm },
  subtitle: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginTop: 8, marginBottom: spacing.xl, lineHeight: 18 },
});
