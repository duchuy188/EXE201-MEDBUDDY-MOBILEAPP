import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screen/HomeScreen';
import DashboardScreen from '../screen/DashboardScreen';
import AddMedicineScreen from '../screen/AddMedicineScreen';
import PhotoCaptureScreen from '../screen/PhotoCaptureScreen';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import HealthStatisticsScreen from '../screen/HealthStatisticsScreen';

import PersonalInfoScreen from '../screen/PersonalInfoScreen';

const Tab = createBottomTabNavigator();

interface BottomTabNavigatorProps {
  userType: 'patient' | 'family';
}

export default function BottomTabNavigator({ userType }: BottomTabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4A90C2',
        tabBarInactiveTintColor: '#A0A4A8',
        tabBarStyle: { height: 60, paddingBottom: 6, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: 'bold' },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Trang chủ') {
            return <Ionicons name="home" size={size} color={color} />;
          } else if (route.name === 'Thêm thuốc') {
            return <MaterialIcons name="add-circle-outline" size={size} color={color} />;
          } else if (route.name === 'Chụp ảnh') {
            return <FontAwesome5 name="camera" size={size} color={color} />;
          } else if (route.name === 'Thống kê') {
            return <Ionicons name="stats-chart-outline" size={size} color={color} />;
          } else if (route.name === 'Thông tin cá nhân') {
            return <AntDesign name="user" size={size} color={color} />;
          }
          return null;
        },
      })}
    >
      <Tab.Screen
        name="Trang chủ"
        children={(props) =>
          userType === 'family'
            ? <DashboardScreen {...props} userType={userType} />
            : <HomeScreen {...props} userType={userType} />
        }
      />
      <Tab.Screen name="Thêm thuốc" component={AddMedicineScreen} />
      <Tab.Screen name="Chụp ảnh" component={PhotoCaptureScreen} />
      <Tab.Screen name="Thống kê" component={HealthStatisticsScreen} />
      <Tab.Screen name="Thông tin cá nhân" component={PersonalInfoScreen} />
    </Tab.Navigator>
  );
}
