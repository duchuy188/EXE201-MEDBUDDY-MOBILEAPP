import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Ionicons } from '@expo/vector-icons';

import AuthService from '../api/authService';
import NotificationService, { SaveTokenRequest } from '../api/Notifications';

const LoginFormScreen = ({ route, navigation }: any) => {
  const accountType = route?.params?.accountType;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!accountType) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorCenter}>Thiếu thông tin loại tài khoản.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Quay lại</Text>
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

      if (result.accessToken && result.refreshToken) {
        await AsyncStorage.setItem('token', result.accessToken);
        await AsyncStorage.setItem('refreshToken', result.refreshToken);

        if (result.user?._id) {
          await AsyncStorage.setItem('userId', result.user._id);
        }
      }

      // ✅ Kiểm tra login thành công
      const isLoginSuccess = !!(
        result.accessToken &&
        result.user &&
        result.message &&
        result.message.toLowerCase().includes('success')
      );

      if (isLoginSuccess) {
        const apiRole = result.user?.role;
        
        if (accountType === 'patient' && apiRole === 'patient') {
          // 🚀 Chỉ gửi deviceToken khi role là patient
          try {
            await messaging().requestPermission();
            const deviceToken = await messaging().getToken();

            if (deviceToken) {
              await AsyncStorage.setItem('deviceToken', deviceToken);

              // Gửi deviceToken lên backend cho patient
              const saveTokenData: SaveTokenRequest = {
                userId: result.user._id,
                deviceToken,
              };
              const response = await NotificationService.saveToken(saveTokenData, result.accessToken);
              console.log('>>> Gửi deviceToken thành công cho patient:', deviceToken, response);
            } else {
              console.warn('>>> Không lấy được deviceToken!');
            }
          } catch (err) {
            console.warn('>>> Lỗi khi lấy hoặc gửi deviceToken:', err);
          }

          setError('');
          navigation.replace('MainTab', {
            userType: 'patient',
            token: result.accessToken,
            userId: result.user?._id,
          });
        } else if (accountType === 'relative' && (apiRole === 'relative' || apiRole === 'family')) {
          // ❌ Không gửi deviceToken cho relative
          console.log('>>> Relative đăng nhập thành công - không gửi deviceToken');
          
          setError('');
          navigation.replace('RelativeTab', {
            userType: 'relative',
            token: result.accessToken,
            userId: result.user?._id,
          });
        } else {
          setError('Tài khoản này không đúng loại bạn đã chọn!');
        }
      } else {
        setError(result.message || 'Đăng nhập thất bại.');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          <Image 
            source={require('../../assets/top_7_app_nhac_nho_uong_thuoc_giup_ban_quan_ly_suc_khoe_hieu_qua_32782764ba.jpg')}
            style={styles.topImage}
            resizeMode="cover"
          />
          <Text style={styles.title}>
            Đăng nhập {accountType === 'patient' ? 'Người bệnh' : 'Người thân'}
          </Text>

          {/* Email label + input */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Mật khẩu label + input + icon con mắt */}
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={22}
                color="#4A90C2"
              />
            </TouchableOpacity>
          </View>

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

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8FF' },
  scrollContainer: { flexGrow: 1 },
  contentContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F8FF' },
  errorCenter: { color: '#f44336', fontSize: 16, marginBottom: 12 },
  backLink: { color: '#4A90C2', fontSize: 16, textDecorationLine: 'underline' },
  topImage: { width: '100%', height: 250, borderRadius: 10, marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 30, textAlign: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: '#D6E6F5', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16, backgroundColor: '#F7FAFC' },
  errorText: { color: 'red', marginBottom: 15, fontSize: 14, textAlign: 'center' },
  forgotPassword: { marginTop: 5, padding: 5, alignItems: 'flex-end', width: '100%' },
  forgotPasswordText: { color: '#4A90C2', fontSize: 14, textDecorationLine: 'underline' },
  loginBtn: { width: '100%', borderRadius: 8, overflow: 'hidden', marginTop: 10 },
  loginBtnGradient: { paddingVertical: 15, alignItems: 'center', borderRadius: 8 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.2 },
  backButton: { marginTop: 20, padding: 10, alignItems: 'center' },
  backButtonText: { color: '#4A90C2', fontSize: 16 },
  label: {
    fontSize: 15,
    color: '#1E3A5F',
    marginBottom: 6,
    marginLeft: 2,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 15,
  },
  inputPassword: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D6E6F5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    paddingRight: 40, // Để chừa chỗ cho icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 13,
    padding: 4,
  },
});

export default LoginFormScreen;
