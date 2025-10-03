import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthService from '../api/authService';

const ForgotPasswordScreen = ({ route, navigation }: any) => {
  const { accountType } = route.params;
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const handleResetPassword = async () => {
    if (isButtonDisabled) return;

    setIsButtonDisabled(true);

    if (!email) {
      setMessage('Vui lòng nhập email.');
      setIsSuccess(false);
      setIsButtonDisabled(false);
      return;
    }

    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Vui lòng nhập đúng định dạng email.');
      setIsSuccess(false);
      setIsButtonDisabled(false);
      return;
    }
    try {
      await AuthService.sendOtp(email);
      setMessage('Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn.');
      setIsSuccess(true);
      // Navigate to OTP verification screen after successful OTP send
      setTimeout(() => {
        navigation.navigate('OTPVerification', { email });
      }, 1500);
    } catch (err: any) {
      setMessage(err.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
      setIsSuccess(false);
    } finally {
      setIsButtonDisabled(false);
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
        
        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.subtitle}>
          Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
        </Text>
        
        <Text style={styles.label}>Email </Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập email của bạn"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {message ? (
          <Text style={[styles.message, isSuccess ? styles.successMessage : styles.errorMessage]}>
            {message}
          </Text>
        ) : null}

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetPassword} disabled={isButtonDisabled}>
          <LinearGradient colors={['#4A90C2', '#7ED6F5']} style={styles.resetBtnGradient}>
            <Text style={styles.resetBtnText}>
              {isButtonDisabled ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại đăng nhập</Text>
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
    height: 200,
    borderRadius: 10,
    marginBottom: 30,
    alignSelf: 'center',
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
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D6E6F5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    color: '#1E3A5F',
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
});

export default ForgotPasswordScreen;
