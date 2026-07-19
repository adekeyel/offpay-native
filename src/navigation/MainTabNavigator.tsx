import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/home/HomeScreen';
import VtuCategoryScreen from '../screens/vtu/VtuCategoryScreen';
import SendOfflineScreen from '../screens/home/SendOfflineScreen';
import ReceiveOfflineScreen from '../screens/home/ReceiveOfflineScreen';
import BankTransferScreen from '../screens/home/BankTransferScreen';
import AddMoneyScreen from '../screens/home/AddMoneyScreen';

import CardScreen from '../screens/card/CardScreen';

import FinanceScreen from '../screens/finance/FinanceScreen';
import WealthProductScreen from '../screens/finance/WealthProductScreen';

import RewardsScreen from '../screens/rewards/RewardsScreen';

import MeScreen from '../screens/me/MeScreen';
import ProfileScreen from '../screens/me/ProfileScreen';
import StatementScreen from '../screens/me/StatementScreen';
import TransactionHistoryScreen from '../screens/me/TransactionHistoryScreen';
import SettingsSecurityScreen from '../screens/me/SettingsSecurityScreen';
import TierUpgradeScreen from '../screens/me/TierUpgradeScreen';
import SupportScreen from '../screens/me/SupportScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  VtuCategory: { category: 'airtime' | 'data' | 'cable' | 'electricity' };
  SendOffline: undefined;
  ReceiveOffline: undefined;
  BankTransfer: undefined;
  AddMoney: undefined;
};
export type FinanceStackParamList = {
  FinanceMain: undefined;
  WealthProduct: { productId: string };
};
export type MeStackParamList = {
  MeMain: undefined;
  Profile: undefined;
  Statement: undefined;
  TransactionHistory: undefined;
  SettingsSecurity: undefined;
  TierUpgrade: undefined;
  Support: undefined;
};

const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="VtuCategory" component={VtuCategoryScreen} options={{ headerShown: true, title: '' }} />
      <HomeStackNav.Screen name="SendOffline" component={SendOfflineScreen} options={{ headerShown: true, title: 'Send (offline)' }} />
      <HomeStackNav.Screen name="ReceiveOffline" component={ReceiveOfflineScreen} options={{ headerShown: true, title: 'Receive (offline)' }} />
      <HomeStackNav.Screen name="BankTransfer" component={BankTransferScreen} options={{ headerShown: true, title: 'Send to bank' }} />
      <HomeStackNav.Screen name="AddMoney" component={AddMoneyScreen} options={{ headerShown: true, title: 'Add Money' }} />
    </HomeStackNav.Navigator>
  );
}

const CardStackNav = createNativeStackNavigator();
function CardStack() {
  return (
    <CardStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CardStackNav.Screen name="CardMain" component={CardScreen} />
    </CardStackNav.Navigator>
  );
}

const FinanceStackNav = createNativeStackNavigator<FinanceStackParamList>();
function FinanceStack() {
  return (
    <FinanceStackNav.Navigator screenOptions={{ headerShown: false }}>
      <FinanceStackNav.Screen name="FinanceMain" component={FinanceScreen} />
      <FinanceStackNav.Screen name="WealthProduct" component={WealthProductScreen} options={{ headerShown: true, title: '' }} />
    </FinanceStackNav.Navigator>
  );
}

const RewardsStackNav = createNativeStackNavigator();
function RewardsStack() {
  return (
    <RewardsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <RewardsStackNav.Screen name="RewardsMain" component={RewardsScreen} />
    </RewardsStackNav.Navigator>
  );
}

const MeStackNav = createNativeStackNavigator<MeStackParamList>();
function MeStack() {
  return (
    <MeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MeStackNav.Screen name="MeMain" component={MeScreen} />
      <MeStackNav.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'My Profile' }} />
      <MeStackNav.Screen name="Statement" component={StatementScreen} options={{ headerShown: true, title: 'Statement of Account' }} />
      <MeStackNav.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ headerShown: true, title: 'Transactions' }} />
      <MeStackNav.Screen name="SettingsSecurity" component={SettingsSecurityScreen} options={{ headerShown: true, title: 'Settings & Security' }} />
      <MeStackNav.Screen name="TierUpgrade" component={TierUpgradeScreen} options={{ headerShown: true, title: 'Upgrade Tier' }} />
      <MeStackNav.Screen name="Support" component={SupportScreen} options={{ headerShown: true, title: 'Support' }} />
    </MeStackNav.Navigator>
  );
}

const Tab = createBottomTabNavigator();

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>;
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.unlock,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: { borderTopColor: colors.line },
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="⌂" focused={focused} /> }} />
      <Tab.Screen name="Card" component={CardStack} options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="▭" focused={focused} /> }} />
      <Tab.Screen name="Finance" component={FinanceStack} options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="◈" focused={focused} /> }} />
      <Tab.Screen name="Rewards" component={RewardsStack} options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="✦" focused={focused} /> }} />
      <Tab.Screen name="Me" component={MeStack} options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="●" focused={focused} /> }} />
    </Tab.Navigator>
  );
}
