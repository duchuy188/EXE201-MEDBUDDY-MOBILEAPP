import AsyncStorage from '@react-native-async-storage/async-storage';
import MedicationService from '../api/Medication';

import { useState } from 'react';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { Alert, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

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

const EditMedicineScreen = ({ route, navigation }: any) => {
  const { medicine } = route.params;
  
  // Parse existing data
  const parseQuantity = (qty: string) => {
    if (!qty) return { value: '', unit: 'viên' };
    const match = qty.match(/^(\d+)\s*(\w+)$/);
    if (match) {
      return { value: match[1], unit: match[2] === 'ml' ? 'lọ' : match[2] };
    }
    return { value: qty, unit: 'viên' };
  };

  const parsedQty = parseQuantity(medicine.quantity);
  
  // Parse times từ medicine.times array
  const initialTimeDosages: { [key: string]: string } = {};
  const initialSelectedTimes: string[] = [];
  const timeMapping: { [key: string]: string } = {
    'Sáng': 'morning',
    'Chiều': 'afternoon',
    'Tối': 'evening'
  };

  if (medicine.times && Array.isArray(medicine.times)) {
    medicine.times.forEach((t: any) => {
      const timeId = timeMapping[t.time];
      if (timeId) {
        initialSelectedTimes.push(timeId);
        // Extract số từ dosage, vd: "1 ml" -> "1"
        const dosageMatch = t.dosage.match(/^(\d+)/);
        initialTimeDosages[timeId] = dosageMatch ? dosageMatch[1] : '';
      }
    });
  }

  const [name, setName] = useState(medicine.name || '');
  const [dosage, setDosage] = useState(parsedQty.value);
  const [selectedUnit, setSelectedUnit] = useState(parsedQty.unit);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [note, setNote] = useState(medicine.note || '');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(initialSelectedTimes);
  const [timeDosages, setTimeDosages] = useState<{ [key: string]: string }>(initialTimeDosages);

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

  const handleUpdate = async () => {
    if (!name || !dosage) {
      Alert.alert('Vui lòng nhập đầy đủ thông tin thuốc!');
      return;
    }
    if (selectedTimes.length === 0) {
      Alert.alert('Vui lòng chọn ít nhất một thời gian uống!');
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
    const displayUnit = unitMapping[selectedUnit];

    if (totalDosage > totalQuantity) {
      Alert.alert(
        'Lỗi liều lượng', 
        `Tổng liều lượng các buổi (${totalDosage} ${displayUnit}) vượt quá tổng số lượng (${totalQuantity} ${displayUnit})!\n\nVui lòng giảm liều lượng hoặc tăng tổng số lượng.`
      );
      return;
    }

    try {
      // Map timeId sang tên tiếng Việt cho API
      const timeReverseMapping: { [key: string]: 'Sáng' | 'Chiều' | 'Tối' } = {
        morning: 'Sáng',
        afternoon: 'Chiều',
        evening: 'Tối'
      };

      // Tạo mảng times theo format API
      const times = selectedTimes.map(timeId => ({
        time: timeReverseMapping[timeId],
        dosage: `${timeDosages[timeId]} ${displayUnit}`
      }));

      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      
      await MedicationService.updateMedication(medicine._id, {
        name,
        form: selectedUnit,
        quantity: `${dosage} ${displayUnit}`,
        times: times,
        note: note || undefined,
      }, token);

      Alert.alert('Thành công', 'Đã cập nhật thông tin thuốc');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Lỗi', 'Cập nhật thuốc thất bại!');
    }
  };

  const displayUnit = unitMapping[selectedUnit];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
          {/* Tổng số lượng */}
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

          {/* Nút lưu thay đổi */}
          <TouchableOpacity
            style={[styles.saveButton, !(name && dosage && selectedTimes.length > 0) && {backgroundColor: '#B6D5FA'}]}
            onPress={handleUpdate}
            disabled={!(name && dosage && selectedTimes.length > 0)}
          >
            <Feather name="edit" size={20} color={name && dosage && selectedTimes.length > 0 ? '#fff' : '#3B82F6'} />
            <Text style={{color: name && dosage && selectedTimes.length > 0 ? '#fff' : '#3B82F6', fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>Lưu thay đổi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 48,
    paddingBottom: 20,
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

export default EditMedicineScreen;