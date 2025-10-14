import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView, Modal, FlatList } from 'react-native';
import { FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';

interface Patient {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
}

interface PatientRelationship {
  _id: string;
  patient: {
    _id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    avatar?: string;
    role: string;
  };
  permissions: string[];
}

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

const AddMedicineRelative: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // @ts-ignore
  const token = route.params?.token || '';
  // @ts-ignore
  const userId = route.params?.userId || '';

  // Patient selection states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // Medication form states
  const [medicineName, setMedicineName] = useState('');
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

  // New fields for stock management
  const [totalQuantity, setTotalQuantity] = useState('');

  const handleCaptureMedicine = () => {
    // @ts-ignore
    navigation.navigate('PhotoCapture', { token, userId });
  };

  // Fetch patients function
  const fetchPatients = async () => {
    try {
      if (!token) return;
      
      console.log('Fetching patients...');
      const patientsData = await RelativePatientService.getPatientsOfRelative(token);
      
      // Transform the relationship data to Patient format
      const relationshipsList: PatientRelationship[] = Array.isArray(patientsData) ? patientsData : [];
      const patientsList: Patient[] = relationshipsList.map((relationship) => ({
        _id: relationship.patient._id,
        email: relationship.patient.email,
        fullName: relationship.patient.fullName,
        phone: relationship.patient.phoneNumber,
        dateOfBirth: relationship.patient.dateOfBirth,
      }));
      
      setPatients(patientsList);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      Alert.alert('Lỗi', 'Không thể lấy danh sách ngưởi bệnh');
    }
  };

  // Load patients when component mounts
  React.useEffect(() => {
    fetchPatients();
  }, [token]);

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
    if (!medicineName || !totalQuantity) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin thuốc (tên, tổng số lượng)!');
      return;
    }
    if (selectedTimes.length === 0) {
      Alert.alert('Vui lòng chọn ít nhất một thời gian uống!');
      return;
    }
    if (!selectedPatient) {
      Alert.alert('Lỗi', 'Vui lòng chọn người bệnh trước khi thêm thuốc.');
      return;
    }
    if (!token) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }

    // Check if all selected times have dosage
    const missingDosage = selectedTimes.some(timeId => !timeDosages[timeId]);
    if (missingDosage) {
      Alert.alert('Vui lòng nhập liều lượng cho tất cả các buổi đã chọn!');
      return;
    }

    // Validate numbers
    const totalQty = parseInt(totalQuantity);

    if (isNaN(totalQty)) {
      Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ cho tổng số lượng!');
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
        userId: selectedPatient._id, // Use selected patient's ID
        name: medicineName,
        form: selectedUnit, // viên, lọ, hộp...
        note: expiryDate || undefined,
        totalQuantity: totalQty,
        times: times, // [{time: 'Sáng', dosage: '1 ml'}, ...]
        createdBy: userId,
        createdByType: 'relative' as const,
      };
      
      console.log('Data gửi lên API:', JSON.stringify(data, null, 2));
      console.log('Selected patient ID:', selectedPatient._id);
      
      await RelativePatientService.createMedicationForPatient(selectedPatient._id, data, token);
      Alert.alert(
        'Thêm thuốc thành công', 
        `Người bệnh: ${selectedPatient.fullName}\nTên: ${medicineName}\nTổng số: ${totalQty} ${displayUnit}\nLiều lượng: ${dosageDetails}\nGhi chú: ${expiryDate || 'Không có'}`
      );
      
      // Reset form
      setMedicineName('');
      setQuantity('');
      setMinQuantity('');
      setExpiryDate('');
      setTotalQuantity('');
      setSelectedTimes([]);
      setSelectedUnit('viên');
      setTimeDosages({ morning: '', afternoon: '', evening: '' });
    } catch (error: any) {
      console.error('Add medication error:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể thêm thuốc.');
    }
  };

  const displayUnit = unitMapping[selectedUnit];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Thêm thuốc mới</Text>
          
          {/* Patient Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chọn người bệnh</Text>
            <TouchableOpacity
              style={styles.patientSelector}
              onPress={() => setShowPatientSelector(true)}
            >
              <Text style={styles.patientSelectorText}>
                {selectedPatient 
                  ? (selectedPatient.fullName || selectedPatient.email)
                  : 'Chọn nguời bệnh'
                }
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#4A7BA7" />
            </TouchableOpacity>
          </View>

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
            <Text style={styles.label}>Tổng số lượng ban đầu *</Text>
            <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                placeholder="VD: 30"
                value={totalQuantity}
                onChangeText={setTotalQuantity}
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
            style={[styles.addBtn, !(medicineName && totalQuantity && selectedTimes.length > 0 && selectedPatient) && {backgroundColor: '#B6D5FA'}]}
            onPress={handleAddMedicine}
            disabled={!(medicineName && totalQuantity && selectedTimes.length > 0 && selectedPatient)}
          >
            <Feather name="plus" size={20} color={medicineName && totalQuantity && selectedTimes.length > 0 && selectedPatient ? '#fff' : '#3B82F6'} />
            <Text style={{color: medicineName && totalQuantity && selectedTimes.length > 0 && selectedPatient ? '#fff' : '#3B82F6', fontWeight: 'bold', fontSize: 16, marginLeft: 8}}>Thêm thuốc</Text>
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

      {/* Patient Selection Modal */}
      <Modal
        visible={showPatientSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPatientSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.patientModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn người bệnh</Text>
              <TouchableOpacity onPress={() => setShowPatientSelector(false)}>
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={patients}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.patientItem,
                    selectedPatient?._id === item._id && styles.selectedPatientItem
                  ]}
                  onPress={() => {
                    setSelectedPatient(item);
                    setShowPatientSelector(false);
                  }}
                >
                  <Text style={styles.patientName}>
                    {item.fullName || 'Tên chưa cập nhật'}
                  </Text>
                  <Text style={styles.patientEmail}>Email: {item.email}</Text>
                  {item.phone && (
                    <Text style={styles.patientPhone}>SĐT: {item.phone}</Text>
                  )}
                  {item.dateOfBirth && (
                    <Text style={styles.patientBirth}>
                      Sinh: {new Date(item.dateOfBirth).toLocaleDateString('vi-VN')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPatientsContainer}>
                  <Text style={styles.emptyPatientsText}>Chưa có người bệnh nào</Text>
                  <TouchableOpacity
                    style={styles.addPatientButton}
                    onPress={() => {
                      setShowPatientSelector(false);
                      // @ts-ignore
                      navigation.navigate('AddRelative');
                    }}
                  >
                    <Text style={styles.addPatientButtonText}>+ Thêm người bệnh mới</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
  // Patient Selector Styles
  patientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  patientSelectorText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  patientModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  patientItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedPatientItem: {
    backgroundColor: '#EBF4FF',
    borderLeftWidth: 3,
    borderLeftColor: '#4A7BA7',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  patientBirth: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyPatientsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPatientsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    padding: 20,
  },
  addPatientButton: {
    backgroundColor: '#4A7BA7',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  addPatientButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

export default AddMedicineRelative;