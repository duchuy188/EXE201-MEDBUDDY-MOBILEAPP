import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
      // TODO: Implement reset password API call here
      // const result = await AuthService.resetPassword(email, otp, newPassword);
      setMessage('Đặt lại mật khẩu thành công!');
      setIsSuccess(true);
      setTimeout(() => {
        navigation.navigate('LoginForm');
      }, 1500);
    } catch (err: any) {
      setMessage(err.message || 'Không thể đặt lại mật khẩu');
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
        <Text style={styles.title}>Đặt lại mật khẩu</Text>
        <Text style={styles.subtitle}>
          Nhập mật khẩu mới cho tài khoản của bạn
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-outline" : "eye-off-outline"} 
              size={24} 
              color="#4A90C2"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
              size={24} 
              color="#4A90C2"
            />
          </TouchableOpacity>
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
  inputContainer: {
    width: '100%',
    marginBottom: 15,
    position: 'relative',
  },
  inputWithIcon: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D6E6F5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 5,
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
