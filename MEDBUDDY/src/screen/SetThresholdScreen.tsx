import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MedicationService from '../api/Medication';

const SetThresholdScreen = ({ route, navigation }: any) => {
  const { medication, onSuccess } = route.params;
  const [threshold, setThreshold] = useState(medication.lowStockThreshold?.toString() || '');

  const handleSetThreshold = async () => {
    if (!threshold || parseFloat(threshold) < 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngưỡng cảnh báo hợp lệ!');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      await MedicationService.updateMedication(medication._id, {
        lowStockThreshold: parseFloat(threshold),
      }, token);

      Alert.alert('Thành công', 'Đã cập nhật ngưỡng cảnh báo');
      if (onSuccess) {
        onSuccess();
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error setting threshold:', err);
      Alert.alert('Lỗi', 'Cập nhật ngưỡng thất bại!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt ngưỡng cảnh báo</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Medication Info */}
          <View style={styles.medicationCard}>
            <View style={styles.medicationHeader}>
              <MaterialIcons name="medication" size={24} color="#3B82F6" />
              <Text style={styles.medicationName}>{medication.name}</Text>
            </View>
            <Text style={styles.medicationInfo}>
              Hiện tại: {medication.remainingQuantity || 0} {medication.form || ''}
            </Text>
          </View>

          {/* Threshold Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Ngưỡng cảnh báo sắp hết</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="VD: 5"
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="numeric"
                placeholderTextColor="#B6D5FA"
              />
              <Text style={styles.unit}>{medication.form || 'viên'}</Text>
            </View>
            <Text style={styles.helperText}>
              Cảnh báo khi số lượng còn lại ≤ ngưỡng này
            </Text>
          </View>

          {/* Quick Selection Buttons */}
          <View style={styles.quickButtons}>
            <Text style={styles.quickLabel}>Chọn nhanh:</Text>
            <View style={styles.buttonRow}>
              {[1, 3, 5, 10].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.quickButton,
                    threshold === value.toString() && styles.quickButtonSelected
                  ]}
                  onPress={() => setThreshold(value.toString())}
                >
                  <Text style={[
                    styles.quickButtonText,
                    threshold === value.toString() && styles.quickButtonTextSelected
                  ]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, !threshold && styles.saveButtonDisabled]}
            onPress={handleSetThreshold}
            disabled={!threshold}
          >
            <MaterialIcons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Lưu ngưỡng</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#F6F8FB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0EA5E9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
  },
  medicationInfo: {
    fontSize: 14,
    color: '#64748B',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 16,
  },
  unit: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  quickButtons: {
    marginBottom: 32,
  },
  quickLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  quickButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  quickButtonTextSelected: {
    color: '#fff',
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

export default SetThresholdScreen;
