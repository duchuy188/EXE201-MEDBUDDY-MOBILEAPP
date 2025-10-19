import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

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

const AddAppointmentRelative = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  // Accept token, userId and optionally a preselected patient passed via navigation
  const { token, userId, selectedPatient: initialSelectedPatient } = route.params as { token?: string; userId?: string; selectedPatient?: Patient };
  
  // Patient selection states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // If a patient was passed via navigation, initialize the selected patient
  React.useEffect(() => {
    if (initialSelectedPatient) {
      setSelectedPatient(initialSelectedPatient);
    }
  }, [initialSelectedPatient]);
  
  // Appointment form states
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [hospital, setHospital] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Upgrade modal state (NEW)
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

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
      Alert.alert('Lỗi', 'Không thể lấy danh sách người bệnh');
    }
  };

  // Load patients when component mounts
  React.useEffect(() => {
    fetchPatients();
  }, [token]);
  
  const handleTimeConfirm = (date: Date) => {
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    setSelectedTime(formattedTime);
    setShowTimePicker(false);
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleAddAppointment = async () => {
    if (!appointmentTitle || !hospital || !location || !selectedTime) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!selectedPatient) {
      Alert.alert('Lỗi', 'Vui lòng chọn người bệnh trước khi thêm lịch hẹn.');
      return;
    }

    try {
      const appointmentData = {
        title: appointmentTitle,
        hospital,
        location,
        date: selectedDate.toISOString(),
        time: selectedTime,
        notes: note,
        userId: selectedPatient._id, // Use selected patient's ID
        status: 'pending' as 'pending'
      };

      console.log('Appointment data:', appointmentData);
      console.log('Selected patient ID:', selectedPatient._id);

      const response = await RelativePatientService.createAppointmentForPatient(selectedPatient._id, appointmentData, token);
      
      if (response) {
        Alert.alert(
          'Thành công',
          `Đã thêm lịch hẹn cho người bệnh: ${selectedPatient.fullName}\nTiêu đề: ${appointmentTitle}\nBệnh viện: ${hospital}\nNgày: ${selectedDate.toLocaleDateString('vi-VN')}\nGiờ: ${selectedTime}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error adding appointment:', error);
      // Try to read server message and status
      const serverMessage: string | undefined = error?.response?.data?.message;
      const status: number | undefined = error?.response?.status;

      // If forbidden and server suggests buying a plan, show upgrade modal
      if (status === 403 && serverMessage) {
        // Adjust condition if server uses different phrasing
        if (serverMessage.toLowerCase().includes('mua gói') || serverMessage.toLowerCase().includes('hẹn tái khám') || serverMessage.toLowerCase().includes('feature')) {
          setUpgradeMessage(serverMessage || 'Vui lòng mua gói để sử dụng tính năng này');
          setUpgradeModalVisible(true);
          return;
        }
      }

      Alert.alert(
        'Lỗi',
        'Không thể thêm lịch hẹn. Vui lòng thử lại sau.'
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Thêm lịch hẹn khám bệnh</Text>

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
                  : 'Chọn người bệnh'
                }
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#4A7BA7" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiêu đề lịch hẹn</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề lịch hẹn"
              value={appointmentTitle}
              onChangeText={setAppointmentTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bệnh viện</Text>
            <TextInput
              style={styles.input}
              placeholder="Chọn bệnh viện"
              value={hospital}
              onChangeText={setHospital}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa điểm</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa điểm"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày hẹn</Text>
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.timeText}>
                {selectedDate.toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thời gian</Text>
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeText}>
                {selectedTime || 'Chọn thời gian'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Nhập ghi chú"
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              !(appointmentTitle && hospital && location && selectedTime && selectedPatient) && styles.addButtonDisabled
            ]}
            onPress={handleAddAppointment}
            disabled={!(appointmentTitle && hospital && location && selectedTime && selectedPatient)}
          >
            <Text style={[
              styles.buttonText,
              !(appointmentTitle && hospital && location && selectedTime && selectedPatient) && styles.buttonTextDisabled
            ]}>
              Thêm lịch hẹn
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            minimumDate={new Date()}
          />

          <DateTimePickerModal
            isVisible={showTimePicker}
            mode="time"
            onConfirm={handleTimeConfirm}
            onCancel={() => setShowTimePicker(false)}
          />
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

      {/* Upgrade modal shown when server returns 403 asking to buy plan (NEW) */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.patientModal, { maxHeight: 240 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Không thể tạo lịch hẹn</Text>
              <TouchableOpacity onPress={() => setUpgradeModalVisible(false)}>
                <MaterialIcons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingTop: 8 }}>
              <Text style={{ color: '#374151', fontSize: 15, lineHeight: 22 }}>
                {upgradeMessage || 'Vui lòng mua gói để sử dụng tính năng này.'}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setUpgradeModalVisible(false)}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 10 }}
                >
                  <Text style={{ color: '#6B7280' }}>Đóng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setUpgradeModalVisible(false);
                    // Navigate to subscription/upgrade screen - replace 'Subscription' with your actual screen name
                    // @ts-ignore
                    navigation.navigate('PackageScreen');
                  }}
                  style={{ backgroundColor: '#4A7BA7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Mua gói</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    margin: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#B6D5FA',
    shadowColor: '#F0F6FF',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 8,
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
  timeInput: {
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    padding: 12,
    height: 48,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonDisabled: {
    backgroundColor: '#B6D5FA',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextDisabled: {
    color: '#64748B',
  },
  // Patient Selector Styles
  patientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  patientSelectorText: {
    fontSize: 16,
    color: '#1E293B',
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
});

export default AddAppointmentRelative;