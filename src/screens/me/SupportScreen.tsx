import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import * as supportApi from '../../api/support';
import { colors, spacing, radius, fontSizes } from '../../theme/colors';
import type { SupportTicket } from '../../types/api';

const STATUS_COLOR: Record<string, string> = {
  open: colors.lock,
  pending: colors.lock,
  resolved: colors.unlock,
  closed: colors.slate,
};

export default function SupportScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    supportApi.myTickets().then((res) => setTickets(res.data)).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!subject.trim() || !message.trim()) return setError('Subject and message are required.');

    setLoading(true);
    try {
      await supportApi.createTicket(subject, message);
      setSubject('');
      setMessage('');
      setSuccess('Your message has been sent. We usually reply within a day.');
      load();
    } catch (err: any) {
      setError(err.message || 'Could not send your message.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Contact support</Text>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <Input label="Subject" value={subject} onChangeText={setSubject} />
        <Input label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
        <Button title="Send" onPress={submit} loading={loading} style={{ marginBottom: spacing.xl }} />

        {tickets.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your past messages</Text>
            {tickets.map((t) => (
              <View key={t.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketSubject}>{t.subject}</Text>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[t.status] ?? colors.slate }]}>
                    <Text style={styles.statusText}>{t.status}</Text>
                  </View>
                </View>
                <Text style={styles.ticketMessage}>{t.message}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  ticketCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketSubject: { fontSize: fontSizes.base, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  statusPill: { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10 },
  statusText: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
  ticketMessage: { fontSize: fontSizes.sm, color: colors.slate, lineHeight: 18 },
});
