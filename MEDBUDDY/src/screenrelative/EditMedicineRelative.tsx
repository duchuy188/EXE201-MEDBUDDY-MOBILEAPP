import AsyncStorage from '@react-native-async-storage/async-storage';
import RelativePatientService from '../api/RelativePatient';

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

const EditMedicineRelative = ({ route, navigation }: any) => {
  const { medicine, patientId } = route.params;
  
  
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
    if (!name) {
      Alert.alert('Vui lòng nhập tên thuốc!');
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
        dosage: `${timeDosages[timeId]} ${medicine.form || 'viên'}`
      }));

      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      
      await RelativePatientService.updatePatientMedication(patientId, medicine._id, {
        name,
        note: note || undefined,
        times: times,
      }, token);

      Alert.alert('Thành công', 'Đã cập nhật thông tin thuốc');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Lỗi', 'Cập nhật thuốc thất bại!');
    }
  };

  const displayUnit = medicine.form || 'viên';

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
            style={[styles.saveButton, !(name && selectedTimes.length > 0) && {backgroundColor: '#B6D5FA'}]}
            onPress={handleUpdate}
            disabled={!(name && selectedTimes.length > 0)}
          >
            <Feather name="edit" size={20} color={name && selectedTimes.length > 0 ? '#fff' : '#3B82F6'} />
            <Text style={{color: name && selectedTimes.length > 0 ? '#fff' : '#3B82F6', fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>Lưu thay đổi</Text>
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

export default EditMedicineRelative;