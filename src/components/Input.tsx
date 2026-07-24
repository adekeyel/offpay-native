import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { colors, radius, fontSizes, spacing } from '../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** When true, renders a Show/Hide toggle and ignores `secureTextEntry` in favor of internal state. */
  isPassword?: boolean;
}

export default function Input({ label, error, style, isPassword, secureTextEntry, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, isPassword && styles.inputWithToggle, error && styles.inputError, style]}
          placeholderTextColor={colors.slate}
          secureTextEntry={isPassword ? !visible : secureTextEntry}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setVisible((v) => !v)} style={styles.toggle} hitSlop={8}>
            <Text style={styles.toggleText}>{visible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: fontSizes.base,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  inputWithToggle: { paddingRight: 56 },
  inputError: { borderColor: colors.danger },
  error: { fontSize: fontSizes.xs, color: colors.danger, marginTop: 4 },
  toggle: { position: 'absolute', right: 14 },
  toggleText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.unlock },
});
