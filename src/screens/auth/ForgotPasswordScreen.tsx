import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import AppFooter from '../../components/AppFooter';
import * as authApi from '../../api/auth';
import { colors, spacing, fontSizes } from '../../theme/colors';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

/**
 * Public "I'm locked out" entry point. Doesn't reset anything itself — it
 * files a request with the admin Recovery Center (see
 * auth.controller.js#requestRecovery), since a password reset needs an
 * identity check a same-session API call can't perform on its own.
 */
export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!email) return setError('Enter the email address on your account.');
    setLoading(true);
    try {
      await authApi.requestRecovery(email, 'password_reset');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter the email address on your account. Our recovery team will verify your identity and
          get back to you.
        </Text>

        {error && <Alert type="error">{error}</Alert>}

        {sent ? (
          <>
            <Alert type="success">If that email is registered, our recovery team has been notified and will be in touch.</Alert>
            <Button title="Back to login" variant="ghost" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.md }} />
          </>
        ) : (
          <>
            <Input label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Button title="Send request" onPress={submit} loading={loading} />
          </>
        )}
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: fontSizes.base, color: colors.slate, marginTop: 4, marginBottom: spacing.lg },
});
