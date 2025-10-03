import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../api/user';
import UserService from '../api/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as ImagePicker from 'expo-image-picker';

const UserDetailScreen = ({ navigation, route }: any) => {
  // State cho modal đổi mật khẩu
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const user = route.params?.user;
  const [firstName, setFirstName] = useState(user?.fullName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.fullName?.split(' ').slice(1).join(' ') || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [birth, setBirth] = useState(user?.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      await UserService.updateProfile({
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        phoneNumber,
        dateOfBirth: birth,
        avatar: avatar,
      }, token);
      setIsEditing(false);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } catch (e: any) {
      console.log('Update profile error:', e && (e.response?.data || e.message) || e);
      Alert.alert('Lỗi', 'Cập nhật thông tin thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Hàm mở modal chỉnh avatar
  const openAvatarModal = () => setAvatarModalVisible(true);
  const closeAvatarModal = () => setAvatarModalVisible(false);

  // Chụp ảnh mới
  const handleTakePhoto = async () => {
    closeAvatarModal();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập camera.');
      return;
    }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  // Chọn ảnh từ thư viện
  const handlePickImage = async () => {
    closeAvatarModal();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập thư viện ảnh.');
      return;
    }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  // Xóa avatar
  const handleRemoveAvatar = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await UserService.removeAvatar(token);
        setAvatar('');
        closeAvatarModal();
        Alert.alert('Thành công', 'Đã xóa ảnh đại diện!');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xóa avatar!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#222" />
      </TouchableOpacity>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ height: 120, backgroundColor: '#e8eaf6', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }} />
          <View style={{ alignItems: 'center', marginTop: -60 }}>
            <View style={{ position: 'relative' }}>
              <Image
                source={avatar ? { uri: avatar } : require('../../assets/icon.png')}
                style={styles.avatar}
              />
              {isEditing && (
                <TouchableOpacity style={styles.editAvatarBtn} onPress={openAvatarModal}>
                  <View style={styles.editAvatarCircle}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>📷</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Modal chỉnh ảnh cá nhân */}
          <Modal
            visible={avatarModalVisible}
            animationType="slide"
            transparent
            onRequestClose={closeAvatarModal}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Chỉnh sửa ảnh đại diện</Text>
                <TouchableOpacity style={styles.modalBtn} onPress={handleTakePhoto}>
                  <Text style={styles.modalBtnText}>Chụp ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtn} onPress={handlePickImage}>
                  <Text style={styles.modalBtnText}>Tải ảnh từ file lên</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtn} onPress={handleRemoveAvatar}>
                  <Text style={[styles.modalBtnText, { color: 'red' }]}>Xóa avatar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#eee' }]} onPress={closeAvatarModal}>
                  <Text style={[styles.modalBtnText, { color: '#222' }]}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.editTitle}>Trang cá nhân</Text>
              {!isEditing && (
                <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
                  <Text style={{ color: '#183153', fontWeight: 'bold', fontSize: 16 }}>Chỉnh sửa thông tin</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.label}>Tên</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? '#f8f8f8' : '#eee' }]}
              placeholder="Tên"
              value={firstName}
              onChangeText={setFirstName}
              editable={isEditing}
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? '#f8f8f8' : '#eee' }]}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              keyboardType="email-address"
            />
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? '#f8f8f8' : '#eee' }]}
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={isEditing}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Ngày sinh</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? '#f8f8f8' : '#eee' }]}
              placeholder="Ngày sinh (YYYY-MM-DD)"
              value={birth}
              onChangeText={setBirth}
              editable={isEditing}
            />
            {!isEditing && (
              <TouchableOpacity style={styles.changePasswordBtn} onPress={() => setPasswordModalVisible(true)}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Thay đổi mật khẩu</Text>
              </TouchableOpacity>
            )}
            
            {/* Modal đổi mật khẩu */}
            <Modal
              visible={passwordModalVisible}
              animationType="slide"
              transparent
              onRequestClose={() => setPasswordModalVisible(false)}
            >
              <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Đổi mật khẩu</Text>
                    
                    <Text style={styles.label}>Mật khẩu cũ</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Mật khẩu hiện tại"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!showCurrentPassword}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        <Ionicons 
                          name={showCurrentPassword ? "eye" : "eye-off"} 
                          size={24} 
                          color="#666" 
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Mật khẩu mới</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Mật khẩu mới"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Ionicons 
                          name={showNewPassword ? "eye" : "eye-off"} 
                          size={24} 
                          color="#666" 
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Xác nhận mật khẩu mới"
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons 
                          name={showConfirmPassword ? "eye" : "eye-off"} 
                          size={24} 
                          color="#666" 
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.saveBtn, { width: '100%' }, loading && { opacity: 0.7 }]}
                      onPress={async () => {
                        if (newPassword !== confirmNewPassword) {
                          Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu mới không khớp!');
                          return;
                        }
                        try {
                          setLoading(true);
                          const token = await AsyncStorage.getItem('token');
                          if (!token) throw new Error('Không tìm thấy token');
                          await UserService.changePassword(currentPassword, newPassword, confirmNewPassword, token);
                          setPasswordModalVisible(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                          setShowCurrentPassword(false);
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                          Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
                        } catch (e: any) {
                          Alert.alert('Lỗi', e?.response?.data?.message || e?.message || 'Đổi mật khẩu thất bại!');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Lưu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { width: '100%', marginTop: 8 }]} 
                      onPress={() => {
                        setPasswordModalVisible(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                    >
                      <Text style={styles.cancelText}>Hủy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>
            
            {isEditing && (
              <>
                <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelBtn, { width: '100%', marginTop: 8 }]} onPress={() => { setIsEditing(false); }}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#e53935',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backArrow: {
    position: 'absolute',
    top: 60,
    left: 12,
    zIndex: 100,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 8,
  },
  modalBtn: {
    backgroundColor: '#183153',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  container: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  editAvatarBtn: {
    position: 'absolute',
    right: -4,
    bottom: 0,
  },
  editAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90C2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
  },
  editTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    height: 50,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    marginBottom: 4,
    marginTop: 8,
  },
  changePasswordBtn: {
    backgroundColor: '#183153',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  info: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  backBtn: {
    marginTop: 24,
    backgroundColor: '#4A90C2',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  backText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#183153',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e8eaf6',
  },
});

export default UserDetailScreen;
