import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { User } from '../api/user';
import UserService from '../api/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const UserDetailScreen = ({ navigation, route }: any) => {
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
      }, token);
      setIsEditing(false);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } catch (e) {
      console.log('Update profile error:', e?.response?.data || e?.message || e);
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
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
      // TODO: upload avatar lên server nếu cần
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
      // TODO: upload avatar lên server nếu cần
    }
  };

  // Xóa avatar
  const handleRemoveAvatar = () => {
    closeAvatarModal();
    setAvatar('');
    // TODO: gọi API xóa avatar nếu cần
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ height: 120, backgroundColor: '#e8eaf6', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }} />
        <View style={{ alignItems: 'center', marginTop: -60 }}>
          <View style={{ position: 'relative' }}>
            <Image
              source={avatar
                ? { uri: avatar }
                : { uri: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg` }
              }
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarBtn} onPress={openAvatarModal}>
              <View style={styles.editAvatarCircle}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>📷</Text>
              </View>
            </TouchableOpacity>
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
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? '#f8f8f8' : '#eee' }]}
              placeholder="Tên"
              value={firstName}
              onChangeText={setFirstName}
              editable={isEditing}
            />
          <TextInput
            style={[styles.input, { backgroundColor: isEditing ? '#f8f8f8' : '#eee' }]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            editable={isEditing}
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: isEditing ? '#f8f8f8' : '#eee' }]}
            placeholder="Số điện thoại"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={isEditing}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, { backgroundColor: isEditing ? '#f8f8f8' : '#eee' }]}
            placeholder="Ngày sinh (YYYY-MM-DD)"
            value={birth}
            onChangeText={setBirth}
            editable={isEditing}
          />
          <TouchableOpacity style={styles.changePasswordBtn}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Change Password</Text>
          </TouchableOpacity>
          {isEditing ? (
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Lưu</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
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
