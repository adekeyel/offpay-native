import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '../screens/auth/LandingScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import LoginScreen from '../screens/auth/LoginScreen';

export type AuthStackParamList = {
  Landing: undefined;
  Register: undefined;
  VerifyOtp: { userId: string; email: string; deviceId: string };
  Login: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
