import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as notificationsApi from '../api/notifications';
import { colors } from '../theme/colors';

/** Bell icon for AppHeader's `right` slot — shows an unread-count badge and navigates to Notifications. */
export default function NotificationBell({ onPress }: { onPress: () => void }) {
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      notificationsApi.getUnreadCount().then((res) => setCount(res.data.count)).catch(() => {});
    }, [])
  );

  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.wrap}>
      <Text style={styles.bell}>🔔</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 4 },
  bell: { fontSize: 18 },
  badge: {
    position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
});
