import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardScreen from '../screenrelative/DashboardScreen';
import AddMedicineRelative from '../screenrelative/AddMedicineRelative';
import PhotoCaptureRelative from '../screenrelative/PhotoCaptureRelative';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import HealthStatisticsRelative from '../screenrelative/HealthStatisticsRelative';
import PersonalInfoRelative from '../screenrelative/PersonalInfoRelative';
import UserDetailRelative from '../screenrelative/UserDetailRelative';
import HelpCenterRelative from '../screenrelative/HelpCenterRelative';
import ArticleListRelative from '../screenrelative/ArticleListRelative';
import MedicationsRelative from '../screenrelative/MedicationsRelative';
import AppointmentsRelative from '../screenrelative/AppointmentsRelative';
import AddAppointmentRelative from '../screenrelative/AddAppointmentRelative';
import MedicationScheduleRelative from '../screenrelative/MedicationScheduleRelative';
import AddReminderRelative from '../screenrelative/AddReminderRelative';
import EditAppointmentRelative from '../screenrelative/EditAppointmentRelative';
import EditMedicineRelative from '../screenrelative/EditMedicineRelative';
import AppSettingsRelative from '../screenrelative/AppSettingsRelative';
import AddRelative from '../screenrelative/AddRelative';
import ConfirmRelativeOTPRelative from '../screenrelative/ConfirmRelativeOTPRelative';
import HealthTrackingRelative from '../screenrelative/HealthTrackingRelative';
import EditReminderRelative from '../screenrelative/EditReminderRelative';
import PackageRelative from '../screenrelative/PackageRelative';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function RelativeTabNavigator({ route }: any) {
  // Lấy params từ route (RelativeTab)
  const userType = route?.params?.userType || 'relative';
  const token = route?.params?.token || '';
  const userId = route?.params?.userId || '';

  function TabScreens() {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#4A90C2',
            tabBarInactiveTintColor: '#A0A4A8',
            tabBarStyle: { 
              height: 60, 
              paddingBottom: 6, 
              paddingTop: 6,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#E5E5E5',
            },
            tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
            tabBarIcon: ({ color, size }) => {
              if (route.name === 'Trang chủ người thân') {
                return <Ionicons name="home" size={size} color={color} />;
              } else if (route.name === 'Quản lý người bệnh') {
                return <MaterialIcons name="supervisor-account" size={size} color={color} />;
              } else if (route.name === 'Lịch chăm sóc') {
                return <MaterialIcons name="schedule" size={size} color={color} />;
              } else if (route.name === 'Báo cáo sức khỏe') {
                return <Ionicons name="stats-chart-outline" size={size} color={color} />;
              } else if (route.name === 'Hồ sơ người thân') {
                return <AntDesign name="user" size={size} color={color} />;
              }
              return null;
            },
          })}
        >
          <Tab.Screen
            name="Trang chủ người thân"
            component={DashboardScreen}
            initialParams={{ userType, token, userId }}
          />
          <Tab.Screen
            name="Quản lý người bệnh"
            component={AddMedicineRelative}
            initialParams={{ userType, token, userId }}
          />
          <Tab.Screen
            name="Lịch chăm sóc"
            component={MedicationScheduleRelative}
            initialParams={{ userType, token, userId }}
          />
          <Tab.Screen
            name="Báo cáo sức khỏe"
            component={HealthStatisticsRelative}
            initialParams={{ userType, token, userId }}
          />
          <Tab.Screen
            name="Hồ sơ người thân"
            component={PersonalInfoRelative}
            initialParams={{ userType, token, userId }}
          />
        </Tab.Navigator>
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RelativeTabs" component={TabScreens} initialParams={{ userType, token, userId }} />
      <Stack.Screen name="UserDetail" component={UserDetailRelative} />
      <Stack.Screen name="HelpCenter" component={HelpCenterRelative} />
      <Stack.Screen name="ArticleList" component={ArticleListRelative} />
      <Stack.Screen 
        name="MedicationsScreen" 
        component={MedicationsRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Danh sách thuốc của người bệnh' }} 
      />
      <Stack.Screen 
        name="AddMedicine" 
        component={AddMedicineRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Thêm thuốc cho người bệnh' }} 
      />
      <Stack.Screen 
        name="Appointments" 
        component={AppointmentsRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Lịch tái khám của người bệnh' }} 
      />
      <Stack.Screen 
        name="AddAppointment" 
        component={AddAppointmentRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Đặt lịch tái khám cho người bệnh' }} 
      />
      <Stack.Screen 
        name="AddReminder" 
        component={AddReminderRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Tạo lịch nhắc cho người bệnh' }} 
      />
      <Stack.Screen 
        name="EditAppointment" 
        component={EditAppointmentRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chỉnh sửa lịch hẹn người bệnh' }} 
      />
      <Stack.Screen 
        name="PhotoCapture" 
        component={PhotoCaptureRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chụp ảnh thuốc cho người bệnh' }} 
      />
      <Stack.Screen 
        name="EditMedicine" 
        component={EditMedicineRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chỉnh sửa thuốc người bệnh' }} 
      />
      <Stack.Screen 
        name="AppSettings" 
        component={AppSettingsRelative}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddRelative" 
        component={AddRelative}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ConfirmRelativeOTP" 
        component={ConfirmRelativeOTPRelative}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="HealthTracking" 
        component={HealthTrackingRelative}
        initialParams={{ token, userId }}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditReminder" 
        component={EditReminderRelative} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chỉnh sửa lịch nhắc người bệnh' }} 
      />
      <Stack.Screen
        name="PackageScreen"
        component={PackageRelative}
        options={{ headerShown: true, title: 'Gói dịch vụ người thân' }}
      />
    </Stack.Navigator>
  );
}
