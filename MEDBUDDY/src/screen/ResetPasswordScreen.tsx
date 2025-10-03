import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../api/authService';

const ResetPasswordScreen = ({ route, navigation }: any) => {
  const { email, otp } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Vui lòng nhập đầy đủ thông tin');
      setIsSuccess(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Mật khẩu phải có ít nhất 6 ký tự');
      setIsSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp');
      setIsSuccess(false);
      return;
    }

    try {
      const response = await AuthService.resetPasswordWithOtp(email, newPassword);
      if (response.success) {
        setMessage('Đặt lại mật khẩu thành công!');
        setIsSuccess(true);
        navigation.navigate('Login');
      } else {
        setMessage(response.message || 'Không thể đặt lại mật khẩu');
        setIsSuccess(false);
      }
    } catch (err: any) {
      setMessage(err.message || 'Không thể đặt lại mật khẩu');
      setIsSuccess(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
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
            <Text style={styles.title}>Đặt lại mật khẩu</Text>
            <Text style={styles.subtitle}>
              Nhập mật khẩu mới cho tài khoản của bạn
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={22} 
                    color="#4A90C2"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye" : "eye-off"} 
                    size={22} 
                    color="#4A90C2"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {message ? (
              <Text style={[styles.message, isSuccess ? styles.successMessage : styles.errorMessage]}>
                {message}
              </Text>
            ) : null}

            <TouchableOpacity style={styles.resetBtn} onPress={handleResetPassword}>
              <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.resetBtnGradient}>
                <Text style={styles.resetBtnText}>Xác nhận</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backButtonText}>Quay lại trang đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#4A6B8A',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 15,
    color: '#1E3A5F',
    marginBottom: 6,
    marginLeft: 2,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputPassword: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D6E6F5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    color: '#1E3A5F',
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  message: {
    marginBottom: 15,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  successMessage: {
    color: '#4CAF50',
  },
  errorMessage: {
    color: '#f44336',
  },
  resetBtn: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  resetBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  resetBtnText: {
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
  topImage: {
  width: '100%',
  height: 200,
  borderRadius: 10,
  marginBottom: 30,
  alignSelf: 'center',
},
});

export default ResetPasswordScreen;
