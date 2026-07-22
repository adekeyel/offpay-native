import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as notificationsApi from '../../api/notifications';
import type { UserNotification } from '../../api/notifications';
import { colors, spacing, radius, fontSizes } from '../../theme/colors';
import type { HomeStackParamList } from '../../navigation/MainTabNavigator';
import AppFooter from '../../components/AppFooter';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

const TYPE_META: Record<UserNotification['type'], { icon: string; label: string }> = {
  login: { icon: '🔐', label: 'Login' },
  app: { icon: '📣', label: 'Announcement' },
  update: { icon: '⬆️', label: 'Update' },
  support: { icon: '💬', label: 'Support' },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen({ navigation }: Props) {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    notificationsApi
      .getNotifications()
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onOpen(n: UserNotification) {
    if (!n.is_read) {
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, is_read: true } : it)));
      notificationsApi.markNotificationRead(n.id).catch(() => {});
    }
    if (n.related_type === 'support_ticket' && n.related_id) {
      navigation.getParent()?.navigate('Me' as never, { screen: 'SupportTicketThread', params: { ticketId: n.related_id } } as never);
    }
  }

  async function onMarkAllRead() {
    setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
    notificationsApi.markAllNotificationsRead().catch(() => {});
  }

  const hasUnread = items.some((i) => !i.is_read);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notifications</Text>
          {hasUnread && (
            <Pressable onPress={onMarkAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {!loading && items.length === 0 && (
          <Text style={styles.emptyText}>You have no notifications yet.</Text>
        )}

        {items.map((n) => {
          const meta = TYPE_META[n.type] ?? { icon: '🔔', label: 'Notification' };
          return (
            <Pressable key={n.id} style={[styles.card, !n.is_read && styles.cardUnread]} onPress={() => onOpen(n)}>
              <View style={styles.cardTop}>
                <Text style={styles.icon}>{meta.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{n.title}</Text>
                    {!n.is_read && <View style={styles.dot} />}
                  </View>
                  <Text style={styles.cardMessage} numberOfLines={3}>{n.message}</Text>
                  <Text style={styles.cardMeta}>{meta.label} · {timeAgo(n.created_at)}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink },
  markAllText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.unlock },
  emptyText: { fontSize: fontSizes.sm, color: colors.slate, textAlign: 'center', marginTop: spacing.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardUnread: { backgroundColor: colors.unlockDim },
  cardTop: { flexDirection: 'row', gap: 10 },
  icon: { fontSize: 20 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: fontSizes.base, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.unlock, marginLeft: 6 },
  cardMessage: { fontSize: fontSizes.sm, color: colors.slate, lineHeight: 18, marginTop: 2 },
  cardMeta: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 6 },
});
