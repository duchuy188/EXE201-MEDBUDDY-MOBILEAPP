import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screen/HomeScreen';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screen/LoginScreen';
import RegisterTypeScreen from '../screen/RegisterTypeScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="MainTab"
          component={({ route, navigation }) => (
            <BottomTabNavigator userType={route?.params?.userType || 'patient'} navigation={navigation} />
          )}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="RegisterType" component={RegisterTypeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
