import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, radius, fontSizes } from '../theme/colors';

interface PinInputProps {
  onComplete: (pin: string) => void;
  disabled?: boolean;
  /** Bumping this prop (e.g. on a wrong-PIN error) clears all digits and refocuses the first box. */
  resetSignal?: number;
}

export default function PinInput({ onComplete, disabled, resetSignal }: PinInputProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  useEffect(() => {
    setDigits(['', '', '', '']);
    refs[0].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  function updateDigit(index: number, value: string) {
    const v = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);

    if (v && index < 3) refs[index + 1].current?.focus();
    if (next.every((d) => d !== '')) onComplete(next.join(''));
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) refs[index - 1].current?.focus();
  }

  return (
    <View style={styles.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={refs[i]}
          value={d}
          editable={!disabled}
          onChangeText={(v) => updateDigit(i, v)}
          onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          secureTextEntry
          style={styles.box}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  box: {
    width: 52, height: 60, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
    textAlign: 'center', fontSize: fontSizes.xxl, fontWeight: '700', color: colors.ink, backgroundColor: colors.white,
  },
});
