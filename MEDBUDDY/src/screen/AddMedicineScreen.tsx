import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import MedicationService from '../api/Medication';
import { useRoute, useNavigation } from '@react-navigation/native';

const timeSlots = [
  { id: 'morning', label: 'Sáng', icon: '🌅' },
  { id: 'afternoon', label: 'Chiều', icon: '☀️' },
  { id: 'evening', label: 'Tối', icon: '🌙' }
];

const unitMapping: { [key: string]: string } = {
  'viên': 'viên',
  'lọ': 'ml',
  'ống': 'ống',
  'gói': 'gói'
};

const AddMedicineScreen: React.FC = () => {
  const navigation = useNavigation();
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('viên');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [timeDosages, setTimeDosages] = useState<{ [key: string]: string }>({
    morning: '',
    afternoon: '',
    evening: ''
  });

  const handleCaptureMedicine = () => {
    // @ts-ignore
    navigation.navigate('PhotoCapture', { token, userId });
  };

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

  const updateTimeDosage = (timeId: string, value: string) => {
    setTimeDosages(prev => ({
      ...prev,
      [timeId]: value
    }));
  };

  const handleAddMedicine = async () => {
    if (!medicineName || !dosage) {
      Alert.alert('Vui lòng nhập đầy đủ thông tin thuốc!');
      return;
    }
    if (selectedTimes.length === 0) {
      Alert.alert('Vui lòng chọn ít nhất một thời gian uống!');
      return;
    }
    if (!token || !userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }

    // Check if all selected times have dosage
    const missingDosage = selectedTimes.some(timeId => !timeDosages[timeId]);
    if (missingDosage) {
      Alert.alert('Vui lòng nhập liều lượng cho tất cả các buổi đã chọn!');
      return;
    }

    // Check tổng liều lượng không vượt quá tổng số lượng
    const totalDosage = selectedTimes.reduce((sum, timeId) => {
      return sum + (parseFloat(timeDosages[timeId]) || 0);
    }, 0);
    const totalQuantity = parseFloat(dosage) || 0;

    if (totalDosage > totalQuantity) {
      const displayUnit = unitMapping[selectedUnit];
      Alert.alert(
        'Lỗi liều lượng', 
        `Tổng liều lượng các buổi (${totalDosage} ${displayUnit}) vượt quá tổng số lượng (${totalQuantity} ${displayUnit})!\n\nVui lòng giảm liều lượng hoặc tăng tổng số lượng.`
      );
      return;
    }

    try {
      const displayUnit = unitMapping[selectedUnit];
      
      // Map timeId sang tên tiếng Việt cho API
      const timeMapping: { [key: string]: 'Sáng' | 'Chiều' | 'Tối' } = {
        morning: 'Sáng',
        afternoon: 'Chiều',
        evening: 'Tối'
      };

      // Tạo mảng times theo format API
      const times = selectedTimes.map(timeId => ({
        time: timeMapping[timeId],
        dosage: `${timeDosages[timeId]} ${displayUnit}`
      }));

      const dosageDetails = times.map(t => `${t.dosage}/${t.time.toLowerCase()}`).join(', ');

      const data = {
        userId,
        name: medicineName,
        form: selectedUnit, // viên, lọ, hộp...
        quantity: `${dosage} ${displayUnit}`, // Tổng số lượng: "30 ml" hoặc "30 viên"
        times: times, // [{time: 'Sáng', dosage: '1 ml'}, ...]
        note: expiryDate || undefined,
      };
      
      console.log('Data gửi lên API:', JSON.stringify(data, null, 2));
      
      await MedicationService.addMedication(data, token);
      Alert.alert(
        'Thêm thuốc thành công', 
        `Tên: ${medicineName}\nTổng số: ${dosage} ${displayUnit}\nLiều lượng: ${dosageDetails}\nGhi chú: ${expiryDate || 'Không có'}`
      );
      setMedicineName('');
      setDosage('');
      setQuantity('');
      setMinQuantity('');
      setExpiryDate('');
      setSelectedTimes([]);
      setSelectedUnit('viên');
      setTimeDosages({ morning: '', afternoon: '', evening: '' });
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể thêm thuốc.');
    }
  };

  const displayUnit = unitMapping[selectedUnit];

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
        {/* Số lượng */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tổng số lượng</Text>
          <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
            <TextInput
              style={[styles.input, {flex: 1}]}
              placeholder="VD: 30"
              value={dosage}
              onChangeText={setDosage}
              placeholderTextColor="#B6D5FA"
              keyboardType="numeric"
            />
            <Text style={styles.unitDisplay}>{displayUnit}</Text>
            <TouchableOpacity 
              style={styles.unitPicker}
              onPress={() => setShowUnitPicker(!showUnitPicker)}
            >
              <Text style={styles.unitText}>{selectedUnit}</Text>
              <Feather name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          {showUnitPicker && (
            <View style={styles.unitDropdown}>
              {['viên', 'lọ', 'ống', 'gói'].map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={styles.unitOption}
                  onPress={() => {
                    setSelectedUnit(unit);
                    setShowUnitPicker(false);
                  }}
                >
                  <Text style={[styles.unitOptionText, selectedUnit === unit && {color: '#3B82F6', fontWeight: 'bold'}]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {/* Ghi chú */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập ghi chú"
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

        {/* Nhập liều lượng cho từng buổi */}
        {selectedTimes.length > 0 && (
          <View style={styles.dosageSection}>
            <Text style={styles.label}>Liều lượng từng buổi</Text>
            {selectedTimes.map(timeId => {
              const slot = timeSlots.find(t => t.id === timeId);
              return (
                <View key={timeId} style={styles.dosageInput}>
                  <Text style={styles.dosageLabel}>
                    {slot?.icon} {slot?.label}:
                  </Text>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <TextInput
                      style={[styles.input, {flex: 1, marginBottom: 0}]}
                      placeholder="VD: 1"
                      value={timeDosages[timeId]}
                      onChangeText={(value) => updateTimeDosage(timeId, value)}
                      placeholderTextColor="#B6D5FA"
                      keyboardType="numeric"
                    />
                    <Text style={styles.dosageUnit}>{displayUnit}/{slot?.label.toLowerCase()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Nút thêm thuốc */}
        <TouchableOpacity
          style={[styles.addBtn, !(medicineName && dosage && selectedTimes.length > 0) && {backgroundColor: '#B6D5FA'}]}
          onPress={handleAddMedicine}
          disabled={!(medicineName && dosage && selectedTimes.length > 0)}
        >
          <Feather name="plus" size={20} color={medicineName && dosage && selectedTimes.length > 0 ? '#fff' : '#3B82F6'} />
          <Text style={{color: medicineName && dosage && selectedTimes.length > 0 ? '#fff' : '#3B82F6', fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>Thêm thuốc</Text>
        </TouchableOpacity>
      
        {/* Nút chụp ảnh thuốc */}
        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleCaptureMedicine}
        >
          <MaterialIcons name="photo-camera" size={20} color="#3B82F6" />
          <Text style={{color: '#3B82F6', fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>Chụp ảnh thuốc</Text>
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
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
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
  unitPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 80,
  },
  unitText: {
    fontSize: 16,
    color: '#1E293B',
    marginRight: 4,
  },
  unitDisplay: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  unitDropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unitOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F6FF',
  },
  unitOptionText: {
    fontSize: 15,
    color: '#64748B',
  },
  dosageSection: {
    backgroundColor: '#F0F6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  dosageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  dosageLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
    minWidth: 70,
  },
  dosageUnit: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default AddMedicineScreen;