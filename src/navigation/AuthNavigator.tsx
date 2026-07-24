import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '../screens/auth/LandingScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import AboutScreen from '../screens/legal/AboutScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';

export type AuthStackParamList = {
  Landing: undefined;
  Register: undefined;
  VerifyOtp: { userId: string; email: string; deviceId: string };
  Login: undefined;
  ForgotPassword: undefined;
  About: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: 'Reset password' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'About OffPay' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: 'Terms of Service' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: true, title: 'Privacy Policy' }} />
    </Stack.Navigator>
  );
}
