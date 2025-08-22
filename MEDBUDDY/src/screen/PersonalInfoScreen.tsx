

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import UserService, { User } from '../api/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PersonalInfoScreen = ({ navigation, route }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  const [token, setToken] = useState<string>('');


  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      // Ưu tiên lấy token từ route.params nếu có
      const navToken = route?.params?.token;
      if (navToken) {
        await AsyncStorage.setItem('token', navToken);
        setToken(navToken);
        const data = await UserService.getProfile(navToken);
        setUser(data);
        console.log('DEBUG: token from params, saved to AsyncStorage:', navToken);
        return;
      }
      // Nếu không có, lấy từ AsyncStorage
      const storedToken = await AsyncStorage.getItem('token');
      console.log('DEBUG token:', storedToken);
      if (storedToken) {
        setToken(storedToken);
        const data = await UserService.getProfile(storedToken);
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('DEBUG error:', error);
    } finally {
      setLoading(false);
    }
  }, [route?.params?.token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    return unsubscribe;
  }, [navigation, fetchProfile]);

  const handleEditProfile = () => {
    if (user) {
      navigation.navigate('UserDetail', { user });
    }
  };

  const handleLogout = () => {
    alert('Đăng xuất thành công!');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4A90C2' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={styles.profileSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#4A90C2" style={{ marginVertical: 24 }} />
          ) : (
            <>
              <Image
                source={user?.avatar
                  ? { uri: user.avatar }
                  : { uri: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg` }
                }
                style={styles.avatar}
              />
              <Text style={styles.name}>{user?.fullName || '---'}</Text>
              <Text style={styles.email}>{user?.email || '---'}</Text>
            </>
          )}
        </View>
        <View style={styles.menuSection}>
          <MenuItem label="Thông tin cá nhân" onPress={handleEditProfile} />
          <MenuItem label="Liên hệ" onPress={() => alert('Liên hệ!')} />
          <MenuItem label="Chính sách bảo mật" onPress={() => alert('Chính sách bảo mật!')} />
          <MenuItem label="Thông tin ứng dụng" onPress={() => alert('Thông tin ứng dụng!')} />
          <MenuItem label="Chia sẻ ứng dụng" onPress={() => alert('Chia sẻ ứng dụng!')} />
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuLabel}>{label}</Text>
    <MaterialIcons name="keyboard-arrow-right" size={24} color="#A0A4A8" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#4A90C2',
    paddingTop: 30,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  menuSection: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 10,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLabel: {
    fontSize: 16,
    color: '#222',
  },
  logoutBtn: {
    backgroundColor: '#4A90C2',
    marginTop: 30,
    marginBottom: 30,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
    paddingVertical: 14,
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default PersonalInfoScreen;
