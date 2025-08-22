import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import MedicationService from '../api/Medication';
import { useRoute } from '@react-navigation/native';

const timeSlots = [
  { id: 'morning', label: 'Sáng', icon: '🌅' },
  { id: 'afternoon', label: 'Chiều', icon: '☀️' },
  { id: 'evening', label: 'Tối', icon: '🌙' }
];

const AddMedicineScreen: React.FC = () => {
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const route = useRoute();
  // @ts-ignore
  const token = route.params?.token || '';
  // @ts-ignore
  const userId = route.params?.userId || '';

  const toggleTimeSlot = (timeId: string) => {
    setSelectedTimes(prev =>
      prev.includes(timeId)
        ? prev.filter(id => id !== timeId)
        : [...prev, timeId]
    );
  };

  const handleAddMedicine = async () => {
    if (!medicineName || !dosage || !quantity) {
      Alert.alert('Vui lòng nhập đầy đủ thông tin thuốc!');
      return;
    }
    if (!token || !userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }
    try {
      const data = {
        userId,
        name: medicineName,
        dosage,
        // form, image, note có thể bổ sung nếu có UI
        timeOfDay: selectedTimes.join(','),
        expirationDate: expiryDate,
        // quantity và minQuantity không có trong interface Medication, có thể cần bổ sung ở backend nếu muốn lưu
      };
      await MedicationService.addMedication(data, token);
      Alert.alert('Thêm thuốc thành công', `Tên: ${medicineName}\nLiều lượng: ${dosage}\nSố lượng: ${quantity}\nThời gian uống: ${selectedTimes.map(id => timeSlots.find(t => t.id === id)?.label).join(', ')}`);
      setMedicineName('');
      setDosage('');
      setQuantity('');
      setMinQuantity('');
      setExpiryDate('');
      setSelectedTimes([]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể thêm thuốc.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.title}>Thêm thuốc mới</Text>
        {/* Tên thuốc */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên thuốc</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Amlodipine"
            value={medicineName}
            onChangeText={setMedicineName}
            placeholderTextColor="#B6D5FA"
          />
        </View>
        {/* Liều lượng */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Liều lượng</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 5mg"
            value={dosage}
            onChangeText={setDosage}
            placeholderTextColor="#B6D5FA"
          />
        </View>
        {/* Số lượng & Số lượng tối thiểu */}
        <View style={{flexDirection: 'row', gap: 12}}>
          <View style={[styles.inputGroup, {flex: 1}]}>  
            <Text style={styles.label}>Số lượng hiện tại</Text>
            <TextInput
              style={styles.input}
              placeholder="30"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              placeholderTextColor="#B6D5FA"
            />
          </View>
          <View style={[styles.inputGroup, {flex: 1}]}>  
            <Text style={styles.label}>Số lượng tối thiểu</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              keyboardType="numeric"
              value={minQuantity}
              onChangeText={setMinQuantity}
              placeholderTextColor="#B6D5FA"
            />
          </View>
        </View>
        {/* Hạn sử dụng */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hạn sử dụng</Text>
          <TextInput
            style={styles.input}
            placeholder="mm/dd.yyyy"
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholderTextColor="#B6D5FA"
            keyboardType="default"
          />
        </View>
        {/* Thời gian uống */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thời gian uống</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 6}}>
            {timeSlots.map(slot => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.timeBtn, selectedTimes.includes(slot.id) && styles.timeBtnSelected]}
                onPress={() => toggleTimeSlot(slot.id)}
              >
                <Text style={{fontSize: 22}}>{slot.icon}</Text>
                <Text style={{fontSize: 13, color: selectedTimes.includes(slot.id) ? '#1E293B' : '#64748B'}}>{slot.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Nút thêm thuốc */}
        <TouchableOpacity
          style={[styles.addBtn, !(medicineName && dosage && quantity) && {backgroundColor: '#B6D5FA'}]}
          onPress={handleAddMedicine}
          disabled={!(medicineName && dosage && quantity)}
        >
          <Feather name="plus" size={20} color={medicineName && dosage && quantity ? '#fff' : '#3B82F6'} />
          <Text style={{color: medicineName && dosage && quantity ? '#fff' : '#3B82F6', fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>Thêm thuốc</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    paddingTop: 48,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#B6D5FA',
    shadowColor: '#F0F6FF',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 18,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    padding: 12,
    minHeight: 48,
  },
  timeBtn: {
    flex: 1,
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 2,
  },
  timeBtnSelected: {
    backgroundColor: '#B6D5FA',
    borderColor: '#3B82F6',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
});

export default AddMedicineScreen;
