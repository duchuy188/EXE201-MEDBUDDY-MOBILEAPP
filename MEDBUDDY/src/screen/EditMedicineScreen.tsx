import AsyncStorage from '@react-native-async-storage/async-storage';
import MedicationService from '../api/Medication';

import { useState } from 'react';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Alert, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const timeSlots = [
  { id: 'morning', label: 'Sáng', icon: '🌅' },
  { id: 'afternoon', label: 'Chiều', icon: '☀️' },
  { id: 'evening', label: 'Tối', icon: '🌙' }
];

const EditMedicineScreen = ({ route, navigation }: any) => {
  const { medicine } = route.params;
  const [name, setName] = useState(medicine.name || '');
  const [dosage, setDosage] = useState(medicine.dosage || '');
  const [quantity, setQuantity] = useState(medicine.quantity || '');
  const [minQuantity, setMinQuantity] = useState(medicine.minQuantity || '');
  const [note, setNote] = useState(medicine.note || '');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(medicine.timeOfDay ? medicine.timeOfDay.split(',') : []);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(medicine.createdAt ? new Date(medicine.createdAt) : new Date());

  const toggleTimeSlot = (timeId: string) => {
    setSelectedTimes(prev =>
      prev.includes(timeId)
        ? prev.filter(id => id !== timeId)
        : [...prev, timeId]
    );
  };

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      await MedicationService.updateMedication(medicine._id, {
        name,
        dosage,
        timeOfDay: selectedTimes.join(','),
        note,
        createdAt: date.toISOString(),
      }, token);
      Alert.alert('Thành công', 'Đã cập nhật thông tin thuốc');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Lỗi', 'Cập nhật thuốc thất bại!');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.title}>Chỉnh sửa thông tin thuốc</Text>
        {/* Tên thuốc */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên thuốc</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Amlodipine"
            value={name}
            onChangeText={setName}
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
        </View>
        {/* Ghi chú */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ghi chú</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập ghi chú"
            value={note}
            onChangeText={setNote}
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
        {/* Nút lưu thay đổi */}
        <TouchableOpacity
          style={[styles.saveButton, !(name && dosage && quantity) && {backgroundColor: '#B6D5FA'}]}
          onPress={handleUpdate}
          disabled={!(name && dosage && quantity)}
        >
          <Feather name="edit" size={20} color={name && dosage && quantity ? '#fff' : '#3B82F6'} />
          <Text style={{color: name && dosage && quantity ? '#fff' : '#3B82F6', fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>Lưu thay đổi</Text>
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
});

export default EditMedicineScreen;
