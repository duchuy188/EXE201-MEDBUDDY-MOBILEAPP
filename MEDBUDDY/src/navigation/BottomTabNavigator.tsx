import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '../screen/HomeScreen';
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
import AddBloodPressureScreen from '../screen/AddBloodPressureScreen';
import EditAppointmentScreen from '../screen/EditAppointmentScreen';
import EditMedicineScreen from '../screen/EditMedicineScreen';
import AppSettingsScreen from '../screen/AppSettingsScreen';
import AddRelativeScreen from '../screen/AddRelativeScreen';
import ConfirmRelativeOTPScreen from '../screen/ConfirmRelativeOTPScreen';
import HealthTrackingScreen from '../screen/HealthTrackingScreen';
import EditReminderScreen from '../screen/EditReminderScreen';
import RemindersScreen from '../screen/RemindersScreen';
import BloodPressureSchedule from '../screen/BloodPressureSchedule';
import PackageScreen from '../screen/PackageScreen'; // Import the new screen
import PackageHistoryScreen from '../screen/PackageHistoryScreen';
import CurrentPackageScreen from '../screen/CurrentPackageScreen';
import SetThresholdScreen from '../screen/SetThresholdScreen';
import AddStockScreen from '../screen/AddStockScreen';
import LowStockScreen from '../screen/LowStockScreen';
import UserPackageService from '../api/UserPackage';
import { useFocusEffect } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function BottomTabNavigator({ route }: any) {
  // Lấy params từ route (MainTab)
  const userType = route?.params?.userType || 'patient';
  const token = route?.params?.token || '';
  const userId = route?.params?.userId || '';

  function TabScreens() {
    const baseTabs = [
      { name: "Trang chủ", component: HomeScreen },
      { name: "Thêm thuốc", component: AddMedicineScreen },
      { name: "Lịch uống thuốc", component: MedicationScheduleScreen },
      { name: "Thông tin cá nhân", component: PersonalInfoScreen },
    ];
    const [tabs, setTabs] = React.useState(baseTabs);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const checkPackage = async () => {
        setLoading(true);
        try {
          const activePackage = await UserPackageService.getMyActivePackage(token);
          console.log('activePackage:', activePackage);
          // Sửa tại đây: kiểm tra activePackage.data.isActive
          if (activePackage?.data?.isActive) {
            // create a new array with 'Thống kê' inserted at position 3
            const withStats = [
              baseTabs[0],
              baseTabs[1],
              baseTabs[2],
              { name: "Thống kê", component: HealthStatisticsScreen },
              baseTabs[3],
            ];
            setTabs(withStats);
          } else {
            setTabs(baseTabs);
          }
        } catch (e) {
          setTabs(prev => prev.filter(tab => tab.name !== "Thống kê"));
        } finally {
          setLoading(false);
        }
      };
      checkPackage();
    }, [token]);

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
          {tabs.map(tab => (
            <Tab.Screen
              key={tab.name}
              name={tab.name}
              component={tab.component}
              initialParams={{ userType, token, userId }}
            />
          ))}
        </Tab.Navigator>
      </SafeAreaView>
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
        name="AddBloodPressure" 
        component={AddBloodPressureScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Thêm lịch đo huyết áp' }} 
      />
      <Stack.Screen 
        name="EditBloodPressure" 
        component={require('../screen/EditBloodPressureScreen').default} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chỉnh sửa lịch đo huyết áp' }} 
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
      <Stack.Screen 
        name="EditReminder" 
        component={EditReminderScreen} 
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Chỉnh sửa lịch nhắc' }} 
      />
      <Stack.Screen
        name="PackageScreen"
        component={PackageScreen}
        options={{ headerShown: true, title: 'Gói dịch vụ' }}
      />
      <Stack.Screen 
        name="MedicationSchedule" 
        component={RemindersScreen} 
        initialParams={{ token, userId }}
        // headerShown false because RemindersScreen already renders its own header
        options={{ headerShown: false, title: 'Lịch hẹn uống thuốc' }} 
      />
      <Stack.Screen
        name="BloodPressureSchedule"
        component={BloodPressureSchedule}
        initialParams={{ token, userId }}
        options={{ headerShown: true, title: 'Lịch đo huyết áp' }}
      />
      <Stack.Screen 
  name="PackageHistory" 
  component={PackageHistoryScreen}
   initialParams={{ token, userId }}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="CurrentPackage" 
  component={CurrentPackageScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="SetThreshold" 
  component={SetThresholdScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="AddStock" 
  component={AddStockScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="LowStock" 
  component={LowStockScreen}
  options={{ headerShown: false }}
/>
    </Stack.Navigator>
  );
}
