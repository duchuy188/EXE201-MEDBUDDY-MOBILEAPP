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

const AddStockRelative = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { medication, patientId, onSuccess } = route.params as any;
  
  const [addedQuantity, setAddedQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!addedQuantity || isNaN(Number(addedQuantity)) || Number(addedQuantity) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực');
        return;
      }

      await RelativePatientService.addMedicationStockForPatient(patientId, medication._id, {
        addedQuantity: Number(addedQuantity)
      }, token);

      Alert.alert('Thành công', `Đã thêm ${addedQuantity} ${medication?.form || 'viên'} vào kho`);
      onSuccess?.();
      navigation.goBack();
    } catch (error) {
      console.error('Error adding stock:', error);
      Alert.alert('Lỗi', 'Thêm thuốc thất bại');
    } finally {
      setLoading(false);
    }
  };

  const quickQuantities = [10, 20, 30, 50];
  const newTotal = (medication?.remainingQuantity || 0) + Number(addedQuantity || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mua thêm thuốc</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.medicationInfo}>
          <MaterialIcons name="medication" size={32} color="#3B82F6" />
          <Text style={styles.medicationName}>{medication?.name}</Text>
          <Text style={styles.medicationForm}>
            {medication?.form || 'viên'} - Hiện tại: {medication?.remainingQuantity || 0}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Số lượng mua thêm</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 20"
            value={addedQuantity}
            onChangeText={setAddedQuantity}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        <View style={styles.quickButtons}>
          <Text style={styles.quickLabel}>Chọn nhanh:</Text>
          <View style={styles.quickButtonRow}>
            {quickQuantities.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickButton,
                  addedQuantity === value.toString() && styles.quickButtonActive
                ]}
                onPress={() => setAddedQuantity(value.toString())}
              >
                <Text style={[
                  styles.quickButtonText,
                  addedQuantity === value.toString() && styles.quickButtonTextActive
                ]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {addedQuantity && (
          <View style={styles.previewCard}>
            <MaterialIcons name="info" size={24} color="#3B82F6" />
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle}>Tổng số lượng sau khi mua:</Text>
              <Text style={styles.previewValue}>
                {newTotal} {medication?.form || 'viên'}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#2563EB" />
          ) : (
            <>
              <MaterialIcons name="add-shopping-cart" size={20} color="#2563EB" />
              <Text style={styles.saveButtonText}>Mua thêm</Text>
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
  quickButtons: {
    marginBottom: 24,
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
  previewCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  previewTitle: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 18,
    color: '#1E40AF',
    fontWeight: 'bold',
    marginTop: 4,
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

export default AddStockRelative;
