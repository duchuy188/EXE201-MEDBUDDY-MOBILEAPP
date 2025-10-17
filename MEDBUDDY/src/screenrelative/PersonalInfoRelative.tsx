import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserService from '../api/user';
import MedicationService from '../api/Medication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../api/Notifications';

const ProfileSettingsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('manage');
  const [user, setUser] = useState<{ fullName?: string; avatar?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('DEBUG token:', token);
      if (token) {
        const data = await UserService.getProfile(token);
        console.log('DEBUG user profile:', data);
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.log('DEBUG fetchProfile error:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  // Create Account section
  const CreateAccountSection = () => (
    <TouchableOpacity style={styles.createAccountCard} onPress={() => navigation.navigate('UserDetail', { user })}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          <Text style={styles.cardSubtitle}>Thay đổi thông tin cá nhân</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  // Essentials section items
  const essentialsItems = [
    {
      id: 'medications',
      title: 'Thuốc của người bệnh',
      icon: 'medical',
      bgColor: '#3B82F6',
      customIcon: (
        <View style={styles.pillsContainer}>
          <View style={[styles.pill, { backgroundColor: '#60A5FA' }]} />
          <View style={[styles.pill, { backgroundColor: '#3B82F6' }]} />
          <View style={[styles.smallPill, { backgroundColor: '#FDE047' }]} />
        </View>
      )
    },
    {
      id: 'medication-schedule',
      title: 'Lịch hẹn uống thuốc người bệnh',
      icon: 'time',
      bgColor: '#F59E0B'
    },
    {
      id: 'health-trackers',
      title: 'Theo dõi sức khỏe & Đo lường',
      icon: 'pulse',
      bgColor: '#16A34A'
    },
    {
      id: 'appointments',
      title: 'Lịch tái khám người bệnh',
      icon: 'calendar',
      bgColor: '#3B82F6'
    },
    {
      id: 'doctors',
      title: 'Người bệnh',
      icon: 'people-outline',
      bgColor: '#0D9488'
    }
  ];

  // Settings section items
  const settingsItems = [
    {
      id: 'app-settings',
      title: 'Cài đặt ứng dụng',
      icon: 'settings',
      bgColor: '#0D9488'
    },
    {
      id: 'upgrade-account',
      title: 'Nâng cấp tài khoản người bệnh',
      icon: 'rocket',
      bgColor: '#4A7BA7'
    },
    {
      id: 'help-center',
      title: 'Trung tâm trợ giúp',
      icon: 'help-circle',
      bgColor: '#3B82F6'
    },
    {
      id: 'share-medisafe',
      title: 'Chia sẻ ứng dụng',
      icon: 'people',
      bgColor: '#3B82F6'
    }
  ];

  const fetchMedications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const medications = await MedicationService.getMedications(token);
        console.log('DEBUG medications:', medications);
        return medications;
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
    return [];
  };

  const MenuItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={async () => {
        if (item.id === 'medications') {
          const medications = await fetchMedications();
          navigation.navigate('MedicationsScreen', { medications });
          } else if (item.id === 'medication-schedule') {
          navigation.navigate('MedicationSchedule');
        } else if (item.id === 'upgrade-account') {
          navigation.navigate('PackageScreen');
        } else if (item.id === 'help-center') {
          navigation.navigate('HelpCenter');
        } else if (item.id === 'appointments') {
          navigation.navigate('Appointments');
        } else if (item.id === 'app-settings') {
          navigation.navigate('AppSettings');
        } else if (item.id === 'health-trackers') {
          // Sửa lại để navigate đúng tên tab
          navigation.navigate('RelativeTabs', { screen: 'Báo cáo sức khỏe' });
        } else if (item.id === 'doctors') {
          navigation.navigate('HealthTracking');
        } else if (item.id === 'share-medisafe') {
          try {
            await Share.share({
              message: 'Hãy thử MedBuddy - Ứng dụng nhắc nhở uống thuốc và quản lý sức khỏe của bạn! \nhttps://play.google.com/store/apps/medbuddy',
              title: 'Chia sẻ MedBuddy'
            });
          } catch (error) {
            console.error('Error sharing app:', error);
          }
        }
      }}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: item.bgColor }]}> 
        {item.customIcon ? item.customIcon : (
          <Ionicons name={item.icon} size={20} color="#fff" />
        )}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            {loading ? (
              <View style={styles.avatar}><ActivityIndicator color="#666" /></View>
            ) : user && user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
            )}
            <Text style={styles.headerTitle}>{user && user.fullName ? user.fullName : 'Khách'}</Text>
          </View>
          <Ionicons name="add" size={24} color="#fff" />
        </View>
      </View> */}

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create Account Section */}
        <CreateAccountSection />

        {/* Essentials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cần thiết</Text>
          {essentialsItems.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          {settingsItems.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => {
          // Xóa token, xóa deviceToken, điều hướng về màn hình đăng nhập
          try {
            // const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const token = await AsyncStorage.getItem('token');
            const deviceToken = await AsyncStorage.getItem('deviceToken');
            const userId = await AsyncStorage.getItem('userId');
            if (token && deviceToken && userId) {
              await NotificationService.deleteToken({ userId, deviceToken }, token);
            }
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('deviceToken');
            await AsyncStorage.removeItem('userId');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (e) {
            // fallback nếu lỗi
            navigation.navigate('Login');
          }
        }}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    backgroundColor: '#e53935',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 100,
    marginTop: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  container: {
    top: 50,
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  header: {
    backgroundColor: '#4A7BA7',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50, // Add extra top padding for status bar/notch
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  createAccountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    borderRadius: 8,
    padding: 12,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  pill: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  smallPill: {
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  bottomNav: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  navTab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  homeIndicator: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  indicator: {
    width: 128,
    height: 4,
    backgroundColor: '#9CA3AF',
    borderRadius: 2,
    opacity: 0.3,
  },
});

export default ProfileSettingsScreen;