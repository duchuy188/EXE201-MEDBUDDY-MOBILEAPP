import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screen/HomeScreen';
import BottomTabNavigator from './BottomTabNavigator';
import RelativeTabNavigator from './RelativeNavigator'; // Thêm import này
import LoginScreen from '../screen/LoginScreen';
import LoginFormScreen from '../screen/LoginFormScreen';
import RegisterTypeScreen from '../screen/RegisterTypeScreen';
import ForgotPasswordScreen from '../screen/ForgotPasswordScreen';
import OTPVerificationScreen from '../screen/OTPVerificationScreen';
import ResetPasswordScreen from '../screen/ResetPasswordScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginForm" component={LoginFormScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="MainTab"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RelativeTab"
          component={RelativeTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="RegisterType" component={RegisterTypeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
