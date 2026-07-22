import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSizes } from '../theme/colors';

/**
 * Company-name footer required on a fintech app's public-facing screens
 * (landing/auth) and legal/info pages. Year is computed so it never goes
 * stale.
 */
export default function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>© {year} OffPay Technology Ltd. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.lg, alignItems: 'center' },
  text: { fontSize: fontSizes.xs, color: colors.slate, textAlign: 'center' },
});
