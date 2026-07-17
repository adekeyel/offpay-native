import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import * as authApi from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSizes } from '../../theme/colors';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

export default function VerifyOtpScreen({ route }: Props) {
  const { userId, email, deviceId } = route.params;
  const { completeRegistrationLogin } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifyEmailOtp(userId, code, deviceId);
      // This is the ONE and only OTP step in the app — it also logs the
      // user straight in, since password + email are both already verified.
      // completeRegistrationLogin sets the session state directly; a fresh
      // registration always has appLockPinSet=false, so RootNavigator will
      // render the standalone SetPin screen next, on its own.
      await completeRegistrationLogin(res.data.accessToken, res.data.refreshToken, res.data.user, res.data.appLockPinSet);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {email}. This is the only time you'll ever need a code — after
          this, you unlock OffPay with a PIN.
        </Text>
        {error && <Alert type="error">{error}</Alert>}
        <Input label="Verification code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} />
        <Button title="Verify" onPress={submit} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: fontSizes.base, color: colors.slate, marginTop: 8, marginBottom: spacing.lg, lineHeight: 20 },
});
