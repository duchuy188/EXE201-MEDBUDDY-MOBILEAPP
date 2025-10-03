import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { MaterialIcons } from '@expo/vector-icons';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define Patient interfaces
interface Patient {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

interface PatientRelationship {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    avatar?: string;
    role: string;
  };
  permissions: string[];
}

const EditAppointmentRelative = ({ route, navigation }: any) => {
  const { appointment, token, selectedPatient } = route.params;
  const [appointmentTitle, setAppointmentTitle] = useState(appointment.title);
  const [hospital, setHospital] = useState(appointment.hospital);
  const [location, setLocation] = useState(appointment.location);
  const [selectedDate, setSelectedDate] = useState(new Date(appointment.date));
  const [selectedTime, setSelectedTime] = useState(appointment.time);
  const [note, setNote] = useState(appointment.notes || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Patient selection states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentSelectedPatient, setCurrentSelectedPatient] = useState<Patient | null>(selectedPatient || null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);

  // Fetch patients function
  const fetchPatients = async () => {
    setPatientLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const patientsData = await RelativePatientService.getPatientsOfRelative(token);
        
        // Handle different possible response structures
        let relationshipsList: PatientRelationship[] = [];
        if (Array.isArray(patientsData)) {
          relationshipsList = patientsData;
        } else if (patientsData && patientsData.data && Array.isArray(patientsData.data)) {
          relationshipsList = patientsData.data;
        } else if (patientsData && patientsData.patients && Array.isArray(patientsData.patients)) {
          relationshipsList = patientsData.patients;
        }
        
        // Transform the relationship data to Patient format
        const patientsList: Patient[] = relationshipsList.map((relationship) => ({
          _id: relationship.patient._id,
          fullName: relationship.patient.fullName,
          email: relationship.patient.email,
          phone: relationship.patient.phoneNumber,
          dateOfBirth: relationship.patient.dateOfBirth,
        }));
        
        setPatients(patientsList);
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
    } finally {
      setPatientLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const handleUpdate = async () => {
    if (!appointmentTitle || !hospital || !location || !selectedTime) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Sử dụng selectedPatient (đã truyền từ màn hình trước) hoặc currentSelectedPatient (người dùng chọn)
    const patientToUse = selectedPatient || currentSelectedPatient;
    
    if (!patientToUse) {
      Alert.alert('Thông báo', 'Vui lòng chọn bệnh nhân');
      return;
    }

    try {
      await RelativePatientService.updatePatientAppointment(
        patientToUse._id,
        appointment._id,
        {
          title: appointmentTitle,
          hospital,
          location,
          date: selectedDate.toISOString(),
          time: selectedTime,
          notes: note,
        },
        token
      );
      Alert.alert('Thành công', 'Cập nhật lịch hẹn thành công!');
      navigation.goBack();
    } catch (error) {
      console.error('Update appointment error:', error);
      Alert.alert('Lỗi', 'Cập nhật thất bại!');
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Chỉnh sửa lịch hẹn khám bệnh</Text>

          {/* Patient Selector - chỉ hiện nếu chưa có selectedPatient */}
          {!selectedPatient && (
            <View style={styles.inputGroup}>
              <View style={styles.selectorHeaderRow}>
                <Text style={styles.label}>Chọn bệnh nhân:</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchPatients}
                  disabled={patientLoading}
                >
                  <MaterialIcons name="refresh" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.patientSelector}
                onPress={() => setShowPatientModal(true)}
              >
                <Text style={styles.patientSelectorText}>
                  {currentSelectedPatient 
                    ? currentSelectedPatient.fullName || currentSelectedPatient.email
                    : 'Chọn bệnh nhân'
                  }
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          )}

          {/* Hiển thị thông tin bệnh nhân đã chọn */}
          {selectedPatient && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bệnh nhân:</Text>
              <View style={styles.selectedPatientInfo}>
                <Text style={styles.selectedPatientName}>{selectedPatient.fullName}</Text>
                {selectedPatient.email && (
                  <Text style={styles.selectedPatientDetail}>📧 {selectedPatient.email}</Text>
                )}
                {selectedPatient.phone && (
                  <Text style={styles.selectedPatientDetail}>📱 {selectedPatient.phone}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiêu đề lịch hẹn</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề lịch hẹn"
              value={appointmentTitle}
              onChangeText={setAppointmentTitle}
              placeholderTextColor="#B6D5FA"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bệnh viện</Text>
            <TextInput
              style={styles.input}
              placeholder="Chọn bệnh viện"
              value={hospital}
              onChangeText={setHospital}
              placeholderTextColor="#B6D5FA"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa điểm</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa điểm"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#B6D5FA"
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
              placeholderTextColor="#B6D5FA"
            />
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleUpdate}
          >
            <Text style={styles.buttonText}>Lưu thay đổi</Text>
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
        visible={showPatientModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.patientModalContent}>
            <View style={styles.patientModalHeader}>
              <Text style={styles.patientModalTitle}>Chọn bệnh nhân</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPatientModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={patients}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.patientItem,
                    currentSelectedPatient?._id === item._id && styles.selectedPatientItem
                  ]}
                  onPress={() => {
                    setCurrentSelectedPatient(item);
                    setShowPatientModal(false);
                  }}
                >
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{item.fullName}</Text>
                    {item.email && (
                      <Text style={styles.patientDetail}>📧 {item.email}</Text>
                    )}
                    {item.phone && (
                      <Text style={styles.patientDetail}>📱 {item.phone}</Text>
                    )}
                    {item.dateOfBirth && (
                      <Text style={styles.patientDetail}>🎂 {new Date(item.dateOfBirth).toLocaleDateString('vi-VN')}</Text>
                    )}
                  </View>
                  {currentSelectedPatient?._id === item._id && (
                    <MaterialIcons name="check-circle" size={24} color="#10B981" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>Không có bệnh nhân nào</Text>
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Patient Selector Styles
  selectorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F0F6FF',
  },
  patientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    padding: 12,
  },
  patientSelectorText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  patientModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patientModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedPatientItem: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  patientDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  // Selected Patient Info Styles
  selectedPatientInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
    padding: 12,
  },
  selectedPatientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  selectedPatientDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
});

export default EditAppointmentRelative;
