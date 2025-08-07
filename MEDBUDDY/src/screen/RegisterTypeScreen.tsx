// ...existing code...
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const RegisterTypeScreen = ({ navigation }: any) => {
  const [userType, setUserType] = useState<'patient' | 'family' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    password: '',
    confirmPassword: ''
  });

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [birthdayError, setBirthdayError] = useState('');
  const validateBirthday = (date: string) => {
    // Định dạng dd/mm/yyyy, kiểm tra hợp lệ cơ bản
    const re = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return re.test(date);
  };
  
  const validateEmail = (email: string) => {
    // Đơn giản, có thể thay regex khác nếu cần
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return re.test(String(email).toLowerCase());
  };
  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      // Chỉ cho nhập số
      const onlyNums = value.replace(/[^0-9]/g, '');
      setFormData((prev: any) => ({ ...prev, [field]: onlyNums }));
      if (onlyNums.length === 0 || onlyNums.length === 10) {
        setPhoneError('');
      } else {
        setPhoneError('Số điện thoại phải đủ 10 số');
      }
      return;
    }
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (field === 'email') {
      if (value.length === 0 || validateEmail(value)) {
        setEmailError('');
      } else {
        setEmailError('Email không hợp lệ');
      }
    }
    if (field === 'birthday') {
      if (value.length === 0 || validateBirthday(value)) {
        setBirthdayError('');
      } else {
        setBirthdayError('Ngày sinh không hợp lệ (dd/mm/yyyy)');
      }
    }
  };

  const handleSubmit = () => {
    if (userType && formData.password === formData.confirmPassword) {
      // Xử lý đăng ký ở đây
      // navigation.navigate('Login');
    }
  };

  if (!userType) {
    return (
      <View style={styles.container}>
        {/* Nút back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#4A90C2" />
        </TouchableOpacity>
        <View style={{width: '100%', alignItems: 'center'}}>
          {/* Header icon */}
          <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.iconCircle}>
            <Ionicons name="heart-outline" size={40} color="#fff" />
          </LinearGradient>
          {/* Tiêu đề */}
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>Chọn loại tài khoản bạn muốn tạo</Text>

          {/* Card Người bệnh */}
          <TouchableOpacity style={styles.card} onPress={() => setUserType('patient')}>
            <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.cardIconWrap}>
              <Ionicons name="person-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.cardTitle}>Người bệnh</Text>
            <Text style={styles.cardDesc}>Tạo tài khoản để theo dõi thuốc và sức khỏe của bạn</Text>
          </TouchableOpacity>

          {/* Card Người thân */}
          <TouchableOpacity style={styles.card} onPress={() => setUserType('family')}>
            <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.cardIconWrap}>
              <MaterialCommunityIcons name="shield-account-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.cardTitle}>Người thân</Text>
            <Text style={styles.cardDesc}>Tạo tài khoản để chăm sóc người thân yêu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Nút back về chọn loại tài khoản */}
      <TouchableOpacity style={styles.backBtn} onPress={() => setUserType(null)}>
        <MaterialCommunityIcons name="arrow-left" size={28} color="#4A90C2" />
      </TouchableOpacity>
      <View style={{width: '100%', alignItems: 'center'}}>
        {/* Header icon */}
        <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.iconCircle}>
          <Ionicons name="heart-outline" size={40} color="#fff" />
        </LinearGradient>
        {/* Tiêu đề */}
        <Text style={styles.title}>Đăng ký {userType === 'patient' ? 'Người bệnh' : 'Người thân'}</Text>
        <Text style={styles.subtitle}>Điền thông tin để tạo tài khoản mới</Text>

        {/* Form đăng ký */}
        <View style={{width: '90%'}}>
          <View style={{marginBottom: 10}}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              value={formData.name}
              onChangeText={text => handleInputChange('name', text)}
              placeholderTextColor="#A0A4A8"
            />
          </View>
          <View style={{marginBottom: 10}}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa chỉ email"
              value={formData.email}
              onChangeText={text => handleInputChange('email', text)}
              placeholderTextColor="#A0A4A8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!emailError && (
              <Text style={{color: 'red', fontSize: 13, marginTop: 2}}>{emailError}</Text>
            )}
          </View>
          <View style={{marginBottom: 10}}>
            <Text style={styles.inputLabel}>Ngày sinh</Text>
            <TextInput
              style={styles.input}
              placeholder="dd/mm/yyyy"
              value={formData.birthday}
              onChangeText={text => handleInputChange('birthday', text)}
              placeholderTextColor="#A0A4A8"
              keyboardType="numeric"
              maxLength={10}
            />
            {!!birthdayError && (
              <Text style={{color: 'red', fontSize: 13, marginTop: 2}}>{birthdayError}</Text>
            )}
          </View>
          <View style={{marginBottom: 10}}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              value={formData.phone}
              onChangeText={text => handleInputChange('phone', text)}
              placeholderTextColor="#A0A4A8"
              keyboardType="phone-pad"
              maxLength={10}
            />
            {!!phoneError && (
              <Text style={{color: 'red', fontSize: 13, marginTop: 2}}>{phoneError}</Text>
            )}
          </View>
          <View style={{marginBottom: 10}}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChangeText={text => handleInputChange('password', text)}
              placeholderTextColor="#A0A4A8"
              secureTextEntry
            />
          </View>
          <View style={{marginBottom: 10}}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChangeText={text => handleInputChange('confirmPassword', text)}
              placeholderTextColor="#A0A4A8"
              secureTextEntry
            />
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <Text style={{color: 'red', fontSize: 13, marginTop: 2}}>Mật khẩu không khớp</Text>
            )}
          </View>
          {/* Đã chuyển báo lỗi lên ngay dưới ô xác nhận mật khẩu */}
          <TouchableOpacity
            style={[styles.loginBtn, {marginTop: 8, opacity: !formData.name || !formData.email || !formData.phone || !formData.birthday || !formData.password || formData.password !== formData.confirmPassword || !!emailError || !!phoneError || !!birthdayError ? 0.5 : 1}]}
            disabled={!formData.name || !formData.email || !formData.phone || !formData.birthday || !formData.password || formData.password !== formData.confirmPassword || !!emailError || !!phoneError || !!birthdayError}
            onPress={handleSubmit}
          >
            <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.loginBtnGradient}>
              <Text style={styles.loginBtnText}>Tạo tài khoản</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={{alignSelf: 'center', marginTop: 10}} onPress={() => navigation.navigate('Login')}>
            <Text style={{color: '#4A90C2', fontSize: 14, fontWeight: 'bold'}}>Đã có tài khoản? Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
// ...existing code...
};

const styles = StyleSheet.create({
  loginBtn: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 2,
  },
  loginBtnGradient: {
    paddingVertical: 12,
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
  inputLabel: {
    color: '#1E3A5F',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F0F5FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D6E6F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1E3A5F',
    marginBottom: 0,
  },
  backBtn: {
    position: 'absolute',
    top: 70, // Đẩy mũi tên xuống cùng với nội dung
    left: 18,
    zIndex: 10,
    backgroundColor: 'transparent',
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    paddingTop: 48, // Đẩy nội dung xuống tránh vướng camera/status bar
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#D6E6F5',
    overflow: 'hidden',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 6,
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
    paddingVertical: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#D6E6F5',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#4A6B8A',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 8,
  },
});

export default RegisterTypeScreen;
