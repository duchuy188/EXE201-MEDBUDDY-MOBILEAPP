import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }: any) => {
  const handleLoginPress = (type: 'patient' | 'relative') => {
    navigation.navigate('LoginForm', { accountType: type });
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
