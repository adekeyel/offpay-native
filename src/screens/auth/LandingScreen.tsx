import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import { colors, spacing, fontSizes } from '../../theme/colors';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

export default function LandingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>
          Off<Text style={{ color: colors.unlock }}>Pay</Text>
        </Text>
        <Text style={styles.tagline}>Money that moves, even offline.</Text>

        <View style={{ marginTop: spacing.xxl, width: '100%' }}>
          <Button title="Create an account" onPress={() => navigation.navigate('Register')} style={{ marginBottom: spacing.md }} />
          <Button title="Log in" variant="ghost" onPress={() => navigation.navigate('Login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  logo: { fontSize: 36, fontWeight: '700', color: colors.ink },
  tagline: { marginTop: spacing.sm, fontSize: fontSizes.md, color: colors.slate },
});
