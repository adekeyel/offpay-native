import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useDeviceSetup } from './src/hooks/useDeviceSetup';

function AppInner() {
  useDeviceSetup();
  return <RootNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppInner />
        <StatusBar style="dark" />
      </NavigationContainer>
    </AuthProvider>
  );
}
