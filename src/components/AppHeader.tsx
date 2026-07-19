import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, fontSizes, radius } from '../theme/colors';

interface AppHeaderProps {
  /** Optional element rendered on the right (e.g. a settings/gear icon). */
  right?: React.ReactNode;
  /** Renders on a dark background (e.g. over the ink-colored balance card area). */
  dark?: boolean;
  onPress?: () => void;
}

/**
 * Small persistent brand mark — the app previously had no logo/name anywhere
 * except the logged-out Landing screen, so once a user is inside the app
 * there was nothing identifying it as OffPay. This sits at the top of the
 * main tab screens.
 */
export default function AppHeader({ right, dark, onPress }: AppHeaderProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <View style={styles.row}>
      <Wrapper style={styles.brand} onPress={onPress} hitSlop={8}>
        <View style={styles.mark}>
          <Text style={styles.markText}>O</Text>
        </View>
        <Text style={[styles.wordmark, dark && styles.wordmarkDark]}>
          Off<Text style={{ color: colors.unlock }}>Pay</Text>
        </Text>
      </Wrapper>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: {
    width: 26, height: 26, borderRadius: radius.sm,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  markText: { color: colors.unlock, fontWeight: '800', fontSize: 14 },
  wordmark: { fontSize: fontSizes.md, fontWeight: '800', color: colors.ink },
  wordmarkDark: { color: colors.white },
});
