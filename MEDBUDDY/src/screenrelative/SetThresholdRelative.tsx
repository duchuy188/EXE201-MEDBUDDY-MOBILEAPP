import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SetThresholdRelative = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { medication, patientId, onSuccess } = route.params as any;
  
  const [threshold, setThreshold] = useState(medication?.lowStockThreshold?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!threshold || isNaN(Number(threshold))) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngưỡng hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực');
        return;
      }

      await RelativePatientService.updatePatientMedication(patientId, medication._id, {
        lowStockThreshold: Number(threshold)
      }, token);

      Alert.alert('Thành công', 'Đã cập nhật ngưỡng cảnh báo');
      onSuccess?.();
      navigation.goBack();
    } catch (error) {
      console.error('Error updating threshold:', error);
      Alert.alert('Lỗi', 'Cập nhật ngưỡng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const quickThresholds = [5, 10, 15, 20];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt ngưỡng cảnh báo</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.medicationInfo}>
          <MaterialIcons name="medication" size={32} color="#3B82F6" />
          <Text style={styles.medicationName}>{medication?.name}</Text>
          <Text style={styles.medicationForm}>
            {medication?.form || 'viên'} - Còn lại: {medication?.remainingQuantity || 0}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ngưỡng cảnh báo sắp hết</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 10"
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="numeric"
            editable={!loading}
          />
          <Text style={styles.helperText}>
            Khi số lượng còn lại ≤ ngưỡng này, hệ thống sẽ cảnh báo
          </Text>
        </View>

        <View style={styles.quickButtons}>
          <Text style={styles.quickLabel}>Chọn nhanh:</Text>
          <View style={styles.quickButtonRow}>
            {quickThresholds.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickButton,
                  threshold === value.toString() && styles.quickButtonActive
                ]}
                onPress={() => setThreshold(value.toString())}
              >
                <Text style={[
                  styles.quickButtonText,
                  threshold === value.toString() && styles.quickButtonTextActive
                ]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#2563EB" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#2563EB" />
              <Text style={styles.saveButtonText}>Lưu ngưỡng</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  medicationInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  medicationForm: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  quickButtons: {
    marginBottom: 32,
  },
  quickLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  quickButtonActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#2563EB',
  },
  quickButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickButtonTextActive: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#B6D5FA',
  },
  saveButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SetThresholdRelative;
