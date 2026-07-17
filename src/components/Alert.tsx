import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontSizes, spacing } from '../theme/colors';

type AlertType = 'error' | 'success' | 'info';

export default function Alert({ type = 'info', children }: { type?: AlertType; children: string }) {
  return (
    <View style={[styles.base, variantStyles[type]]}>
      <Text style={[styles.text, textVariantStyles[type]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  text: { fontSize: fontSizes.sm, lineHeight: 18 },
});

const variantStyles = StyleSheet.create({
  error: { backgroundColor: '#FDECEC', borderColor: '#F5C6C6' },
  success: { backgroundColor: colors.unlockDim, borderColor: colors.unlock },
  info: { backgroundColor: colors.paper, borderColor: colors.line },
});

const textVariantStyles = StyleSheet.create({
  error: { color: colors.danger },
  success: { color: '#12654A' },
  info: { color: colors.ink },
});
