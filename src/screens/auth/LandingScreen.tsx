import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import AppFooter from '../../components/AppFooter';
import { colors, spacing, fontSizes } from '../../theme/colors';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

export default function LandingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.logo}>
          Off<Text style={{ color: colors.unlock }}>Pay</Text>
        </Text>
        <Text style={styles.tagline}>Money that moves, even offline.</Text>

        <View style={{ marginTop: spacing.xxl, width: '100%' }}>
          <Button title="Create an account" onPress={() => navigation.navigate('Register')} style={{ marginBottom: spacing.md }} />
          <Button title="Log in" variant="ghost" onPress={() => navigation.navigate('Login')} />
        </View>
      </View>

      <View style={styles.legalRow}>
        <Pressable onPress={() => navigation.navigate('About')}><Text style={styles.legalLink}>About</Text></Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable onPress={() => navigation.navigate('Terms')}><Text style={styles.legalLink}>Terms</Text></Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable onPress={() => navigation.navigate('PrivacyPolicy')}><Text style={styles.legalLink}>Privacy Policy</Text></Pressable>
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  logoImage: { width: 88, height: 88, marginBottom: spacing.md },
  logo: { fontSize: 36, fontWeight: '700', color: colors.ink },
  tagline: { marginTop: spacing.sm, fontSize: fontSizes.md, color: colors.slate },
  legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  legalLink: { fontSize: fontSizes.xs, color: colors.slate, textDecorationLine: 'underline' },
  legalDot: { fontSize: fontSizes.xs, color: colors.slate },
});
