import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthService from '../api/authService';

const RegisterTypeScreen = ({ navigation }: any) => {
  const [userType, setUserType] = useState<'patient' | 'relative' | null>(null);
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(1990, 0, 1));
  
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

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      setFormData((prev: any) => ({ ...prev, birthday: formattedDate }));
      setBirthdayError('');
    }
  };

  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setRegisterError('');
    setRegisterSuccess('');
    if (userType && formData.password === formData.confirmPassword) {
      setLoading(true);
      try {
        const result = await AuthService.register({
          fullName: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
          password: formData.password,
          role: userType,
          dateOfBirth: formData.birthday,
        });
        console.log('Register result:', result);
        // Kiểm tra message có chứa 'success' (không phân biệt hoa thường)
        if (result.message && result.message.toLowerCase().includes('success')) {
          setRegisterSuccess('');
          setRegisterError('');
          Alert.alert(
            'Thông báo',
            'Bạn đã đăng ký thành công!',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Login'),
              },
            ],
            { cancelable: false }
          );
        } else {
          setRegisterError(result.message || 'Đăng ký thất bại.');
          setRegisterSuccess('');
        }
      } catch (err: any) {
        setRegisterError(err.message || 'Đăng ký thất bại.');
        setRegisterSuccess('');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!userType) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#4A90C2" />
        </TouchableOpacity>
        <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.iconCircle}>
          <Ionicons name="heart-outline" size={48} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>Đăng ký tài khoản</Text>
        <Text style={styles.subtitle}>Chọn loại tài khoản bạn muốn tạo</Text>

        {/* Card Người bệnh */}
        <View style={styles.card}>
          <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.cardIconWrap}>
            <Ionicons name="person-outline" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.cardTitle}>Người bệnh</Text>
          <Text style={styles.cardDesc}>Tạo tài khoản để theo dõi thuốc và sức khỏe của bạn</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => setUserType('patient')}>
            <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.loginBtnGradient}>
              <Text style={styles.loginBtnText}>Đăng ký</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Card Người thân */}
        <View style={styles.card}>
          <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.cardIconWrap}>
            <MaterialCommunityIcons name="shield-account-outline" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.cardTitle}>Người thân</Text>
          <Text style={styles.cardDesc}>Tạo tài khoản để chăm sóc người thân yêu</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => setUserType('relative')}>
            <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.loginBtnGradient}>
              <Text style={styles.loginBtnText}>Đăng ký</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#F0F8FF' }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* Nút back về chọn loại tài khoản */}
          <TouchableOpacity style={styles.backBtn} onPress={() => setUserType(null)}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#4A90C2" />
          </TouchableOpacity>
          
          {/* Header icon */}
          <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.iconCircle}>
            <Ionicons name="heart-outline" size={40} color="#fff" />
          </LinearGradient>
          
          {/* Tiêu đề */}
          <Text style={styles.title}>Đăng ký {userType === 'patient' ? 'Người bệnh' : 'Người thân'}</Text>
          <Text style={styles.subtitle}>Điền thông tin để tạo tài khoản mới</Text>

          {/* Form đăng ký */}
          <View style={styles.formWrapper}>
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
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{color: formData.birthday ? '#1E3A5F' : '#A0A4A8', fontSize: 15}}>
                  {formData.birthday || 'dd/mm/yyyy'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity 
                  style={{backgroundColor: '#4A90C2', padding: 10, borderRadius: 8, marginTop: 8}}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={{color: '#fff', textAlign: 'center', fontWeight: 'bold'}}>Xác nhận</Text>
                </TouchableOpacity>
              )}
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
            {registerError ? (
              <Text style={{color: 'red', fontSize: 13, marginTop: 6, marginBottom: 2}}>{registerError}</Text>
            ) : null}
            {registerSuccess ? (
              <Text style={{color: 'green', fontSize: 13, marginTop: 6, marginBottom: 2}}>{registerSuccess}</Text>
            ) : null}
            <TouchableOpacity
              style={[{width: '100%', borderRadius: 8, overflow: 'hidden', marginTop: 8}, {opacity: loading || !formData.name || !formData.email || !formData.phone || !formData.birthday || !formData.password || formData.password !== formData.confirmPassword || !!emailError || !!phoneError || !!birthdayError ? 0.5 : 1}]}
              disabled={loading || !formData.name || !formData.email || !formData.phone || !formData.birthday || !formData.password || formData.password !== formData.confirmPassword || !!emailError || !!phoneError || !!birthdayError}
              onPress={handleSubmit}
            >
              <LinearGradient colors={["#4A90C2", "#7ED6F5"]} style={styles.loginBtnGradient}>
                <Text style={styles.loginBtnText}>{loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={{alignSelf: 'center', marginTop: 10}} onPress={() => navigation.navigate('Login')}>
              <Text style={{color: '#4A90C2', fontSize: 14, fontWeight: 'bold'}}>Đã có tài khoản? Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
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
    top: 70,
    left: 18,
    zIndex: 10,
    backgroundColor: 'transparent',
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    paddingTop: 48,
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
  cardBtn: {
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
    width: 180,
  },
  cardBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  cardBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 48,
    minHeight: '100%',
  },
  formWrapper: {
    width: '90%',
    paddingBottom: 50,
  },
});

export default RegisterTypeScreen;