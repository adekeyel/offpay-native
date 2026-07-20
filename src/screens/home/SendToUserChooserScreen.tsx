import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, fontSizes, radius } from '../../theme/colors';
import type { HomeStackParamList } from '../../navigation/MainTabNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'SendToUserChooser'>;

/** Entry point for "To OffPay User" — pick instant online transfer, or the offline (QR/nearby) flow. */
export default function SendToUserChooserScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Send to an OffPay user</Text>
        <Text style={styles.subtitle}>Choose how you'd like to send this transfer.</Text>

        <Pressable style={styles.option} onPress={() => navigation.navigate('SendToWallet')}>
          <Text style={styles.optionIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Send online</Text>
            <Text style={styles.optionSubtitle}>Instant, by wallet ID. Needs an internet connection.</Text>
          </View>
        </Pressable>

        <Pressable style={styles.option} onPress={() => navigation.navigate('SendOffline')}>
          <Text style={styles.optionIcon}>📶</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Send nearby (offline)</Text>
            <Text style={styles.optionSubtitle}>Scan a QR code in person. Works with zero connectivity.</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: fontSizes.sm, color: colors.slate, marginTop: 4, marginBottom: spacing.lg },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  optionIcon: { fontSize: 24 },
  optionTitle: { fontSize: fontSizes.base, fontWeight: '700', color: colors.ink },
  optionSubtitle: { fontSize: fontSizes.xs, color: colors.slate, marginTop: 2, lineHeight: 16 },
});
