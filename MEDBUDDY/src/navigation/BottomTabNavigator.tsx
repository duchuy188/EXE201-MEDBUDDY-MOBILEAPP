import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screen/HomeScreen';
import DashboardScreen from '../screen/DashboardScreen';
import AddMedicineScreen from '../screen/AddMedicineScreen';
import PhotoCaptureScreen from '../screen/PhotoCaptureScreen';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import HealthStatisticsScreen from '../screen/HealthStatisticsScreen';
import PersonalInfoScreen from '../screen/PersonalInfoScreen';
import UserDetailScreen from '../screen/UserDetailScreen';
import HelpCenterScreen from '../screen/HelpCenterScreen';
import ArticleListScreen from '../screen/ArticleListScreen';
import MedicationsScreen from '../screen/MedicationsScreen';
import AppointmentsScreen from '../screen/AppointmentsScreen';
import AddAppointmentScreen from '../screen/AddAppointmentScreen';
import MedicationScheduleScreen from '../screen/MedicationScheduleScreen';
import AddReminderScreen from '../screen/AddReminderScreen';
import EditAppointmentScreen from '../screen/EditAppointmentScreen';
import EditMedicineScreen from '../screen/EditMedicineScreen';
import AppSettingsScreen from '../screen/AppSettingsScreen';
import AddRelativeScreen from '../screen/AddRelativeScreen';
import ConfirmRelativeOTPScreen from '../screen/ConfirmRelativeOTPScreen';
import HealthTrackingScreen from '../screen/HealthTrackingScreen';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function BottomTabNavigator({ route }: any) {
  // Lấy params từ route (MainTab)
  const userType = route?.params?.userType || 'patient';
  const token = route?.params?.token || '';
  const userId = route?.params?.userId || '';

  function TabScreens() {
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
            } else if (route.name === 'Lịch uống thuốc') {
              return <MaterialIcons name="schedule" size={size} color={color} />;
            }
            return null;
          },
        })}
      >
        <Tab.Screen
          name="Trang chủ"
          component={HomeScreen}
          initialParams={{ userType, token, userId }}
        />
        <Tab.Screen
          name="Thêm thuốc"
          component={AddMedicineScreen}
          initialParams={{ userType, token, userId }}
        />
        <Tab.Screen
          name="Lịch uống thuốc"
          component={MedicationScheduleScreen}
          initialParams={{ userType, token, userId }}
        />
        {/* <Tab.Screen
          name="Chụp ảnh"
          component={PhotoCaptureScreen}
          initialParams={{ userType, token, userId }}
        /> */}
        <Tab.Screen
          name="Thống kê"
          component={HealthStatisticsScreen}
          initialParams={{ userType, token, userId }}
        />
        <Tab.Screen
          name="Thông tin cá nhân"
          component={PersonalInfoScreen}
          initialParams={{ userType, token, userId }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabScreens} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="ArticleList" component={ArticleListScreen} />
      <Stack.Screen 
        name="MedicationsScreen" 
        component={MedicationsScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Danh sách thuốc' }} 
      />
      <Stack.Screen 
        name="AddMedicine" 
        component={AddMedicineScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Thêm thuốc' }} 
      />
      <Stack.Screen 
        name="Appointments" 
        component={AppointmentsScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Lịch tái khám' }} 
      />
      <Stack.Screen 
        name="AddAppointment" 
        component={AddAppointmentScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Tạo tái khám' }} 
      />
      <Stack.Screen 
        name="AddReminder" 
        component={AddReminderScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Thêm lịch nhắc' }} 
      />
      <Stack.Screen 
        name="EditAppointment" 
        component={EditAppointmentScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chỉnh sửa lịch hẹn tái khám' }} 
      />
      <Stack.Screen 
        name="PhotoCapture" 
        component={PhotoCaptureScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chụp ảnh thuốc' }} 
      />
      <Stack.Screen 
        name="EditMedicine" 
        component={EditMedicineScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chỉnh sửa thuốc' }} 
      />
      <Stack.Screen 
        name="AppSettings" 
        component={AppSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddRelative" 
        component={AddRelativeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ConfirmRelativeOTP" 
        component={ConfirmRelativeOTPScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="HealthTracking" 
        component={HealthTrackingScreen}
        initialParams={{ token, userId }}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
