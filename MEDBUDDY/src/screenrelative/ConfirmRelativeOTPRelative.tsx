import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ConfirmRelativeOTPRelative = ({ route, navigation }: any) => {
  const { linkId } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmOTP = async () => {
    if (!otp) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await RelativePatientService.confirmRelativePatient({ 
          linkId,
          otp 
        }, token);
        
        Alert.alert(
          'Thành công',
          'Xác nhận kết nối thành công',
          [{ text: 'OK', onPress: () => navigation.navigate('HealthTracking') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận OTP</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#4A7BA7" />
          <Text style={styles.infoText}>
            Vui lòng nhập mã OTP đã được gửi đến email của bạn để xác nhận kết nối với người thân
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mã OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mã OTP gồm 6 số"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirmOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Xác nhận</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4A7BA7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#4A7BA7',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 4,
  },
  confirmButton: {
    backgroundColor: '#4A7BA7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfirmRelativeOTPRelative;
