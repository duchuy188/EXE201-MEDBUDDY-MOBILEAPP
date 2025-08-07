import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const userImage = { uri: 'https://randomuser.me/api/portraits/men/1.jpg' };

const PersonalInfoScreen = ({ navigation }: any) => {
  const handleEditProfile = () => {
    // navigation.navigate('EditProfile');
    alert('Chức năng chỉnh sửa thông tin cá nhân!');
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
          <Image source={userImage} style={styles.avatar} />
          <Text style={styles.name}>Nguyễn Văn A</Text>
          <Text style={styles.email}>nguyenvana@gmail.com</Text>
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
