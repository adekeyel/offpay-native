import AdBanner from '../../components/AdBanner';
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import * as supportApi from '../../api/support';
import type { SupportTopic, SupportFaq } from '../../api/support';
import { colors, spacing, radius, fontSizes } from '../../theme/colors';
import type { SupportTicket } from '../../types/api';
import type { MeStackParamList } from '../../navigation/MainTabNavigator';
import AppFooter from '../../components/AppFooter';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<MeStackParamList, 'Support'>;

const STATUS_COLOR: Record<string, string> = {
  open: colors.lock,
  pending: colors.lock,
  resolved: colors.unlock,
  closed: colors.slate,
};

export default function SupportScreen({ navigation }: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [topics, setTopics] = useState<SupportTopic[]>([]);
  const [faqs, setFaqs] = useState<Record<string, SupportFaq[]>>({});
  const [activeFaqTab, setActiveFaqTab] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [composeY, setComposeY] = useState(0);

  const load = useCallback(() => {
    supportApi.myTickets().then((res) => setTickets(res.data)).catch(() => {});
    supportApi.getTopics().then((res) => setTopics(res.data)).catch(() => {});
    supportApi.getFaqs().then((res) => {
      setFaqs(res.data);
      setActiveFaqTab((prev) => prev ?? Object.keys(res.data)[0] ?? null);
    }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function scrollToCompose() {
    scrollRef.current?.scrollTo({ y: composeY, animated: true });
  }

  function selectTopic(topic: SupportTopic) {
    setSubject(topic.prefill_subject || topic.label);
    setMessage(topic.prefill_message || '');
    scrollToCompose();
  }

  function toggleFaq(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqId((prev) => (prev === id ? null : id));
  }

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

  const faqTabs = Object.keys(faqs);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <AdBanner page="support" position="top" />
        <Text style={styles.title}>How can we help?</Text>

        {topics.length > 0 && (
          <View style={styles.topicsGrid}>
            {topics.map((t) => (
              <Pressable key={t.id} style={styles.topicTile} onPress={() => selectTopic(t)}>
                <Text style={styles.topicIcon}>{t.icon}</Text>
                <Text style={styles.topicLabel}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Button title="💬  Live Chat" onPress={scrollToCompose} style={{ marginTop: spacing.md, marginBottom: spacing.xl }} />

        {faqTabs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Help you may need</Text>
            <View style={styles.faqTabsRow}>
              {faqTabs.map((tab) => (
                <Pressable key={tab} onPress={() => setActiveFaqTab(tab)} style={styles.faqTab}>
                  <Text style={[styles.faqTabText, activeFaqTab === tab && styles.faqTabTextActive]}>{tab}</Text>
                  {activeFaqTab === tab && <View style={styles.faqTabUnderline} />}
                </Pressable>
              ))}
            </View>
            <View style={styles.faqList}>
              {(faqs[activeFaqTab || ''] || []).map((faq, i) => (
                <Pressable key={faq.id} style={styles.faqRow} onPress={() => toggleFaq(faq.id)}>
                  <View style={styles.faqRowHeader}>
                    <Text style={styles.faqIndex}>{i + 1}</Text>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Text style={styles.faqChevron}>{openFaqId === faq.id ? '⌄' : '›'}</Text>
                  </View>
                  {openFaqId === faq.id && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View onLayout={(e) => setComposeY(e.nativeEvent.layout.y)} style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>Still need help? Message support</Text>
          {error && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}

          <Input label="Subject" value={subject} onChangeText={setSubject} />
          <Input label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
          <Button title="Send" onPress={submit} loading={loading} style={{ marginBottom: spacing.xl }} />
        </View>

        {tickets.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your past messages</Text>
            {tickets.map((t) => (
              <Pressable
                key={t.id}
                style={styles.ticketCard}
                onPress={() => navigation.navigate('SupportTicketThread', { ticketId: t.id })}
              >
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketSubject}>{t.subject}</Text>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[t.status] ?? colors.slate }]}>
                    <Text style={styles.statusText}>{t.status}</Text>
                  </View>
                </View>
                <Text style={styles.ticketMessage} numberOfLines={2}>
                  {t.last_reply_message
                    ? `${t.last_reply_author_type === 'admin' ? 'Support: ' : 'You: '}${t.last_reply_message}`
                    : t.message}
                </Text>
                {t.last_reply_author_type === 'admin' && <Text style={styles.newReplyTag}>New reply — tap to view</Text>}
              </Pressable>
            ))}
          </>
        )}
        <AdBanner page="support" position="bottom" />
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },

  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  topicTile: {
    width: '31%', backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', marginBottom: spacing.sm,
  },
  topicIcon: { fontSize: 22, marginBottom: 6 },
  topicLabel: { fontSize: fontSizes.xs, fontWeight: '600', color: colors.ink, textAlign: 'center' },

  faqTabsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  faqTab: { marginRight: spacing.lg, paddingBottom: spacing.xs },
  faqTabText: { fontSize: fontSizes.sm, color: colors.slate, fontWeight: '600' },
  faqTabTextActive: { color: colors.ink },
  faqTabUnderline: { height: 2, backgroundColor: colors.unlock, marginTop: 4, borderRadius: 1 },

  faqList: { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: spacing.lg },
  faqRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  faqRowHeader: { flexDirection: 'row', alignItems: 'center' },
  faqIndex: { fontSize: fontSizes.sm, color: colors.slate, marginRight: spacing.sm },
  faqQuestion: { flex: 1, fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink },
  faqChevron: { fontSize: fontSizes.lg, color: colors.slate, marginLeft: spacing.sm },
  faqAnswer: { fontSize: fontSizes.sm, color: colors.slate, lineHeight: 19, marginTop: spacing.sm },

  ticketCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketSubject: { fontSize: fontSizes.base, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  statusPill: { borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10 },
  statusText: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
  ticketMessage: { fontSize: fontSizes.sm, color: colors.slate, lineHeight: 18 },
  newReplyTag: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.unlock, marginTop: 6 },
});
