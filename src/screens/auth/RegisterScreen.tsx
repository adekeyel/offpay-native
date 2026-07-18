import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system/next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import * as authApi from '../../api/auth';
import { getOrCreateDeviceId } from '../../auth/secureStorage';
import { colors, spacing, fontSizes } from '../../theme/colors';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bvn, setBvn] = useState('');
  const [password, setPassword] = useState('');
  const [passportUri, setPassportUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickPassportPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera access is needed to take your passport photograph.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setPassportUri(result.assets[0].uri);
  }

  async function submit() {
    setError(null);
    if (!fullName || !email || !phone || !bvn || !password) return setError('All fields are required.');
    if (!/^\d{11}$/.test(bvn)) return setError('BVN must be exactly 11 digits.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (!passportUri) return setError('A passport photograph is required for identity verification.');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('fullName', fullName);
      fd.append('email', email);
      fd.append('phone', phone);
      fd.append('bvn', bvn);
      fd.append('password', password);
      // NOTE: the old RN-style `{ uri, name, type }` form part is NOT supported by this
      // Expo SDK's fetch/FormData implementation and throws "Unsupported FormDataPart
      // implementation". In expo-file-system 57.x, `File` implements the `Blob` interface
      // directly (there is no separate .blob() method) — pass the File instance itself.
      const passportFile = new File(passportUri);
      fd.append('passport', passportFile, 'passport.jpg');

      const res = await authApi.register(fd);
      const deviceId = await getOrCreateDeviceId();
      navigation.navigate('VerifyOtp', { userId: res.data.userId, email: res.data.email, deviceId });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>We need a few details to verify your identity.</Text>

        {error && <Alert type="error">{error}</Alert>}

        <Input label="Full name (as it is on your BVN)" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <Input label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Bank Verification Number (BVN)" value={bvn} onChangeText={(v) => setBvn(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={11} />
        <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>Passport photograph</Text>
        {passportUri ? (
          <Image source={{ uri: passportUri }} style={styles.preview} />
        ) : (
          <Button title="Take photo" variant="ghost" onPress={pickPassportPhoto} style={{ marginBottom: spacing.md }} />
        )}
        {passportUri && <Button title="Retake photo" variant="ghost" onPress={pickPassportPhoto} style={{ marginBottom: spacing.md }} />}

        <Button title="Create account" onPress={submit} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl },
  title: { fontSize: fontSizes.xxl, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: fontSizes.base, color: colors.slate, marginTop: 4, marginBottom: spacing.lg },
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  preview: { width: 100, height: 100, borderRadius: 12, marginBottom: spacing.md },
});