import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, fontSizes, spacing } from '../theme/colors';

interface GenderToggleProps {
  label?: string;
  value: 'male' | 'female' | null;
  onChange: (value: 'male' | 'female') => void;
  error?: string;
}

export default function GenderToggle({ label = 'Sex', value, onChange, error }: GenderToggleProps) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <Option title="Male" active={value === 'male'} onPress={() => onChange('male')} />
        <Option title="Female" active={value === 'female'} onPress={() => onChange('female')} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function Option({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.option, active && styles.optionActive]} onPress={onPress}>
      <Text style={[styles.optionText, active && styles.optionTextActive]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 12, alignItems: 'center', backgroundColor: colors.white,
  },
  optionActive: { borderColor: colors.unlock, backgroundColor: colors.unlockDim },
  optionText: { fontSize: fontSizes.base, fontWeight: '600', color: colors.slate },
  optionTextActive: { color: colors.unlock },
  error: { fontSize: fontSizes.xs, color: colors.danger, marginTop: 4 },
});
