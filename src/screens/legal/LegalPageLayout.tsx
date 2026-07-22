import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import AppFooter from '../../components/AppFooter';
import { colors, spacing, fontSizes } from '../../theme/colors';

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export default function LegalPageLayout({
  updatedLabel,
  children,
}: {
  /** e.g. "Last updated: July 2026" */
  updatedLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {updatedLabel ? <Text style={styles.updated}>{updatedLabel}</Text> : null}
        {children}
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  updated: { fontSize: fontSizes.xs, color: colors.slate, marginBottom: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  body: { fontSize: fontSizes.sm, color: colors.ink700, lineHeight: 20 },
});
