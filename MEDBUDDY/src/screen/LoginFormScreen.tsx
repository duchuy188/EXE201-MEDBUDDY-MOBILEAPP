import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../api/authService';

const LoginFormScreen = ({ route, navigation }: any) => {
  const accountType = route?.params?.accountType;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!accountType) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F8FF' }}>
        <Text style={{ color: '#f44336', fontSize: 16, marginBottom: 12 }}>Thiếu thông tin loại tài khoản.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#4A90C2', fontSize: 16, textDecorationLine: 'underline' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const result = await AuthService.login({ email, password });
      console.log('Login API result:', result);
      console.log('API returned role:', result.user?.role);

      if (result.token) {
        console.log('>>> Đăng nhập thành công, token:', result.token);
        await AsyncStorage.setItem('token', result.token);
        if (result.user?._id) {
          await AsyncStorage.setItem('userId', result.user._id);
          console.log('>>> Lưu userId thành công:', result.user._id);
        } else {
          console.warn('>>> Không tìm thấy userId để lưu!');
        }
      } else {
        console.warn('>>> Đăng nhập KHÔNG có token!');
      }

      const isLoginSuccess = !!(result.token && result.user && result.message && result.message.toLowerCase().includes('success'));
      if (isLoginSuccess) {
        const apiRole = result.user?.role;
        if (!apiRole) {
          setError('Không xác định được loại tài khoản từ máy chủ.');
          setLoading(false);
          return;
        }
        if (
          (accountType === 'patient' && apiRole === 'patient') ||
          (accountType === 'relative' && (apiRole === 'relative' || apiRole === 'family'))
        ) {
          setError('');
          setLoading(false);
          navigation.replace('MainTab', { 
            userType: apiRole === 'family' ? 'relative' : apiRole, 
            token: result.token, 
            userId: result.user?._id 
          });
        } else {
          setError('Tài khoản này không thuộc loại bạn đã chọn. Vui lòng chọn đúng loại tài khoản!');
          setLoading(false);
        }
      } else {
        if (result.message && !result.message.toLowerCase().includes('success')) {
          setError(result.message);
        } else {
          setError('Đăng nhập thất bại.');
        }
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Image 
          source={require('../../assets/top_7_app_nhac_nho_uong_thuoc_giup_ban_quan_ly_suc_khoe_hieu_qua_32782764ba.jpg')}
          style={styles.topImage}
          resizeMode="cover"
        />
      <Text style={styles.title}>Đăng nhập {accountType === 'patient' ? 'Người bệnh' : 'Người thân'}</Text>
      
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity 
        style={styles.forgotPassword}
        onPress={() => navigation.navigate('ForgotPassword', { accountType })}
      >
        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
        <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.loginBtnGradient}>
          <Text style={styles.loginBtnText}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Quay lại</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  topImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 30,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D6E6F5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    fontSize: 14,
    textAlign: 'center',
  },
  loginBtn: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  loginBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#4A90C2',
    fontSize: 16,
  },
  forgotPassword: {
    marginTop: 5,
    padding: 5,
    alignItems: 'flex-end',
    width: '100%',
  },
  forgotPasswordText: {
    color: '#4A90C2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginFormScreen;
