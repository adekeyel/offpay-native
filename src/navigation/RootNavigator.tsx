import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import UnlockScreen from '../screens/auth/UnlockScreen';
import StandaloneSetPinScreen from '../screens/auth/StandaloneSetPinScreen';

export default function RootNavigator() {
  const { session } = useAuth();

  if (session.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  if (session.status === 'unauthenticated') return <AuthNavigator />;
  if (session.status === 'locked') return <UnlockScreen />;
  if (session.status === 'needs-pin-setup') return <StandaloneSetPinScreen user={session.user} />;

  return <MainTabNavigator />;
}
