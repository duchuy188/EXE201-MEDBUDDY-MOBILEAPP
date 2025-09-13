import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const OTPVerificationScreen = ({ route, navigation }: any) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Move to previous input when deleting
    if (value === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setMessage('Vui lòng nhập đủ 6 số');
      setIsSuccess(false);
      return;
    }

    try {
      // TODO: Implement OTP verification API call here
      // const result = await AuthService.verifyOTP(email, otpString);
      setMessage('Xác thực thành công!');
      setIsSuccess(true);
      // Navigate to reset password screen after successful verification
      navigation.navigate('ResetPassword', { email, otp: otpString });
    } catch (err: any) {
      setMessage(err.message || 'Mã OTP không chính xác');
      setIsSuccess(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      // TODO: Implement resend OTP API call here
      // await AuthService.resendOTP(email);
      setMessage('Đã gửi lại mã OTP mới');
      setIsSuccess(true);
    } catch (err: any) {
      setMessage('Không thể gửi lại mã OTP');
      setIsSuccess(false);
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
        <Text style={styles.title}>Xác thực OTP</Text>
        <Text style={styles.subtitle}>
          Nhập mã OTP đã được gửi đến email {email}
        </Text>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              keyboardType="number-pad"
              maxLength={1}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && digit === '' && index > 0) {
                  inputRefs.current[index - 1]?.focus();
                }
              }}
            />
          ))}
        </View>

        {message ? (
          <Text style={[styles.message, isSuccess ? styles.successMessage : styles.errorMessage]}>
            {message}
          </Text>
        ) : null}

        <TouchableOpacity style={styles.resendButton} onPress={handleResendOTP}>
          <Text style={styles.resendButtonText}>Gửi lại mã OTP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOTP}>
          <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.verifyBtnGradient}>
            <Text style={styles.verifyBtnText}>Xác nhận</Text>
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#D6E6F5',
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: '#F7FAFC',
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
  verifyBtn: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  verifyBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  resendButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'flex-end',
  },
  resendButtonText: {
    color: '#4A90C2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  backButton: {
    marginTop: 10,
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

export default OTPVerificationScreen;
