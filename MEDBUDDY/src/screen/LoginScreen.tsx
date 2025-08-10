import React, { useState } from 'react';
import AuthService from '../api/authService';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'patient' | 'relative' | null>(null);
  const [error, setError] = useState('');

  const handleLoginPress = (type: 'patient' | 'relative') => {
    setAccountType(type);
    setModalVisible(true);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    try {
      const result = await AuthService.login({ email, password });
      console.log('Login API result:', result);
      console.log('API returned role:', result.user?.role);
      // Kiểm tra token trả về
      if (result.token) {
        console.log('>>> Đăng nhập thành công, token:', result.token);
      } else {
        console.warn('>>> Đăng nhập KHÔNG có token!');
      }
      // Xử lý backend không trả về result.success, chỉ có message/token/user
      const isLoginSuccess = !!(result.token && result.user && result.message && result.message.toLowerCase().includes('success'));
      if (isLoginSuccess) {
        const apiRole = result.user?.role;
        if (!apiRole) {
          setError('Không xác định được loại tài khoản từ máy chủ.');
          return;
        }
        if (
          (accountType === 'patient' && apiRole === 'patient') ||
          (accountType === 'relative' && (apiRole === 'relative' || apiRole === 'family'))
        ) {
          setModalVisible(false);
          setError('');
          navigation.replace('MainTab', { userType: apiRole === 'family' ? 'relative' : apiRole, token: result.token, userId: result.user?._id });
        } else {
          setError('Tài khoản này không thuộc loại bạn đã chọn. Vui lòng chọn đúng loại tài khoản!');
        }
      } else {
        // Nếu có message lỗi từ backend thì hiển thị, còn không thì báo thất bại chung
        if (result.message && !result.message.toLowerCase().includes('success')) {
          setError(result.message);
        } else {
          setError('Đăng nhập thất bại.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon lớn */}
      <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.iconCircle}>
        <Ionicons name="heart-outline" size={48} color="#fff" />
      </LinearGradient>
      {/* Tiêu đề */}
      <Text style={styles.title}>HAP MEDBUDDY</Text>
      <Text style={styles.subtitle}>Chọn loại tài khoản để đăng nhập</Text>

      {/* Card Người bệnh */}
      <View style={styles.card}>
        <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.cardIconWrap}>
          <Ionicons name="person-outline" size={36} color="#fff" />
        </LinearGradient>
        <Text style={styles.cardTitle}>Người bệnh</Text>
        <Text style={styles.cardDesc}>Theo dõi thuốc và huyết áp của bạn</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => handleLoginPress('patient')}>
          <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.loginBtnGradient}>
            <Text style={styles.loginBtnText}>Đăng nhập</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Card Người thân */}
      <View style={styles.card}>
        <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.cardIconWrap}>
          <MaterialCommunityIcons name="shield-account-outline" size={36} color="#fff" />
        </LinearGradient>
        <Text style={styles.cardTitle}>Người thân</Text>
        <Text style={styles.cardDesc}>Theo dõi sức khỏe người thân yêu</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => handleLoginPress('relative')}>
          <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.loginBtnGradient}>
            <Text style={styles.loginBtnText}>Đăng nhập</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {/* Modal đăng nhập */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đăng nhập {accountType === 'patient' ? 'Người bệnh' : accountType === 'relative' ? 'Người thân' : ''}</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {/* Chỉ hiển thị error, không hiển thị thành công nếu không chuyển màn hình */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Pressable style={styles.modalBtn} onPress={handleLogin}>
                <Text style={styles.modalBtnText}>Đăng nhập</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#ccc' }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#333' }]}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Đăng ký */}
      <View style={styles.registerWrap}>
        <Text style={styles.registerText}>Chưa có tài khoản?</Text>
        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('RegisterType')}>
          <Text style={styles.registerBtnText}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1E3A5F',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D6E6F5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#F7FAFC',
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
    fontSize: 13,
  },
  modalBtn: {
    backgroundColor: '#4A90C2',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 4,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    paddingTop: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#D6E6F5',
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#4A6B8A',
    fontSize: 15,
    marginBottom: 18,
  },
  card: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 22,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#D6E6F5',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#4A6B8A',
    fontSize: 14,
    marginBottom: 14,
    textAlign: 'center',
  },
  loginBtn: {
    width: '90%',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 2,
  },
  loginBtnGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  registerWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    color: '#4A6B8A',
    fontSize: 14,
    marginBottom: 4,
  },
  registerBtn: {
    borderWidth: 1.5,
    borderColor: '#4A90C2',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 6,
    backgroundColor: '#F0F5FF',
  },
  registerBtnText: {
    color: '#4A90C2',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default LoginScreen;
