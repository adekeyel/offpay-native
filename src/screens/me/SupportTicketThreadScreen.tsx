import AdBanner from '../../components/AdBanner';
import AppFooter from '../../components/AppFooter';
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import * as supportApi from '../../api/support';
import { colors, spacing, radius, fontSizes } from '../../theme/colors';
import type { SupportTicket, SupportReply } from '../../types/api';
import type { MeStackParamList } from '../../navigation/MainTabNavigator';

type Props = NativeStackScreenProps<MeStackParamList, 'SupportTicketThread'>;

export default function SupportTicketThreadScreen({ route }: Props) {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    supportApi.getTicketThread(ticketId)
      .then((res) => { setTicket(res.data.ticket); setReplies(res.data.replies); })
      .catch((err) => setError(err.message || 'Could not load this conversation.'));
  }, [ticketId]);

  // Reload every time the screen is focused so a new admin reply shows up
  // as soon as the user opens (or comes back to) this ticket — there's no
  // push notification for this yet, so a fresh fetch on focus is the
  // simplest way to make sure they're not looking at stale data.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      await supportApi.replyToTicket(ticketId, reply.trim());
      setReply('');
      load();
    } catch (err: any) {
      setError(err.message || 'Could not send your reply.');
    } finally {
      setSending(false);
    }
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        {error && <View style={{ padding: spacing.xl }}><Alert type="error">{error}</Alert></View>}
      </SafeAreaView>
    );
  }

  // Merge the ticket's original message in as the first "bubble" alongside the replies.
  const messages = [
    { id: 'original', author_type: 'user' as const, message: ticket.message, created_at: ticket.created_at },
    ...replies,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AdBanner page="support-thread" position="top" />
        <Text style={styles.subject}>{ticket.subject}</Text>
        {error && <Alert type="error">{error}</Alert>}
        {messages.map((m) => (
          <View
            key={m.id}
            style={[styles.bubble, m.author_type === 'admin' ? styles.bubbleAdmin : styles.bubbleUser]}
          >
            <Text style={[styles.bubbleAuthor, m.author_type === 'admin' && styles.bubbleAuthorAdmin]}>
              {m.author_type === 'admin' ? 'OffPay Support' : 'You'}
            </Text>
            <Text style={[styles.bubbleText, m.author_type === 'admin' && styles.bubbleTextAdmin]}>{m.message}</Text>
          </View>
        ))}
        <AppFooter />
      </ScrollView>

      <View style={styles.replyBar}>
        <Input
          placeholder="Type a reply…"
          value={reply}
          onChangeText={setReply}
          style={{ flex: 1 }}
        />
        <Button title="Send" onPress={sendReply} loading={sending} style={{ marginLeft: spacing.sm }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  subject: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.ink, marginBottom: spacing.lg },
  bubble: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, maxWidth: '85%' },
  bubbleUser: { backgroundColor: colors.white, alignSelf: 'flex-end' },
  bubbleAdmin: { backgroundColor: colors.ink, alignSelf: 'flex-start' },
  bubbleAuthor: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.slate, marginBottom: 4 },
  bubbleAuthorAdmin: { color: colors.line },
  bubbleText: { fontSize: fontSizes.sm, color: colors.ink, lineHeight: 18 },
  bubbleTextAdmin: { color: colors.white },
  replyBar: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper,
  },
});
