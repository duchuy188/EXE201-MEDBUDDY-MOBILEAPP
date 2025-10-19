import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, RefreshControl, FlatList, Alert } from 'react-native';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define Appointment type
type Appointment = {
  _id: string;
  title: string;
  hospital: string;
  location: string;
  date: string;
  time: string;
  notes?: string;
  status: string;
};

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

const AppointmentsRelative = ({ navigation }: any) => {
  // Add type definition for appointments and patients
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Patient selection states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAppointments().then(() => setRefreshing(false));
  }, []);

  // Fetch patients function
  const fetchPatients = async () => {
    setPatientLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        console.log('Fetching patients with token:', token?.substring(0, 20) + '...');
        const patientsData = await RelativePatientService.getPatientsOfRelative(token);
        console.log('Raw patients response:', patientsData);
        
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
        
        console.log('Processed patients list:', patientsList);
        setPatients(patientsList);
        
        if (patientsList.length === 0) {
          console.log('No patients found. You may need to add patients first using the addPatientRelative API.');
        }
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setPatientLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!selectedPatient) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Current token:', token);
      
      if (token && selectedPatient) {
        console.log('Fetching appointments for patient:', selectedPatient._id);
        const response = await RelativePatientService.getPatientAppointments(selectedPatient._id, token);
        console.log('Full API response:', JSON.stringify(response, null, 2));
        
        // Kiểm tra cấu trúc response
        if (response) {
          if (Array.isArray(response)) {
            console.log('Response is an array, setting directly');
            setAppointments(response);
          } else if (response.data && Array.isArray(response.data)) {
            console.log('Response has data array, setting from data');
            console.log('Appointments data:', response.data);
            console.log('Number of appointments:', response.data.length);
            setAppointments(response.data);
          } else if (response.appointments && Array.isArray(response.appointments)) {
            console.log('Response has appointments array, setting from appointments');
            setAppointments(response.appointments);
          } else {
            console.log('Invalid response structure:', response);
            setAppointments([]);
          }
        } else {
          console.log('No response data');
          setAppointments([]);
        }
      } else {
        console.log('No token or selected patient found');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        // @ts-ignore
        if (error.response) {
          // @ts-ignore
          console.error('Error response:', error.response.data);
          // @ts-ignore
          console.error('Error status:', error.response.status);
        }
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchAppointments();
    }
  }, [selectedPatient]);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedPatient) {
        fetchAppointments();
      }
    }, [selectedPatient])
  );

  // Add delete logic for appointment in list
  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!selectedPatient) {
      alert('Vui lòng chọn người bệnh trước khi xóa lịch tái khám.');
      return;
    }
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      alert('Không tìm thấy token xác thực.');
      return;
    }
    try {
      const response = await RelativePatientService.deletePatientAppointment(selectedPatient._id, appointmentId, token);
      if (response?.success) {
        fetchAppointments();
        alert('Đã xóa lịch tái khám thành công!');
      } else {
        alert(response?.message || 'Xóa lịch tái khám thất bại.');
      }
    } catch (error) {
      console.error('Delete appointment error:', error);
      alert('Có lỗi xảy ra khi xóa lịch tái khám.');
    }
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => {
        setSelectedAppointment(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={24} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>Bệnh viện: {item.hospital}</Text>
          <Text style={styles.cardSubtitle}>Địa điểm: {item.location}</Text>
          <Text style={styles.cardSubtitle}>Ngày: {new Date(item.date).toLocaleDateString()} - Giờ: {item.time}</Text>
          <Text style={styles.cardSubtitle}>Ghi chú: {item.notes || 'Không có ghi chú'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Patient Selector */}
      <View style={styles.patientSelectorContainer}>
        <View style={styles.selectorHeaderRow}>
          <Text style={styles.selectorLabel}>Chọn người bệnh:</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchPatients}
            disabled={patientLoading}
          >
            <MaterialIcons name="refresh" size={20} color="#4A7BA7" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.patientSelector}
          onPress={() => setShowPatientModal(true)}
        >
          <Text style={styles.patientSelectorText}>
            {selectedPatient 
              ? selectedPatient.fullName || selectedPatient.email
              : 'Chọn người bệnh'
            }
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#4A7BA7" />
        </TouchableOpacity>
      </View>

      {!selectedPatient ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chọn người bệnh để xem lịch tái khám</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
      ) : appointments.length > 0 ? (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chưa có lịch tái khám</Text>
        </View>
      )}

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
              <Text style={styles.patientModalTitle}>Chọn người bệnh</Text>
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
                    selectedPatient?._id === item._id && styles.selectedPatientItem
                  ]}
                  onPress={() => {
                    setSelectedPatient(item);
                    setShowPatientModal(false);
                  }}
                >
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{item.fullName}</Text>
                    {item.email && (
                      <Text style={styles.patientDetail}>Email: {item.email}</Text>
                    )}
                    {item.phone && (
                      <Text style={styles.patientDetail}>Điện thoại: {item.phone}</Text>
                    )}
                    {item.dateOfBirth && (
                      <Text style={styles.patientDetail}>Sinh nhật: {new Date(item.dateOfBirth).toLocaleDateString('vi-VN')}</Text>
                    )}
                  </View>
                  {selectedPatient?._id === item._id && (
                    <MaterialIcons name="check-circle" size={24} color="#10B981" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>Không có người bệnh nào</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {selectedPatient && (
        <View style={styles.addButtonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={async () => {
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');
            if (!selectedPatient) {
              alert('Vui lòng chọn người bệnh trước');
              return;
            }
            navigation.navigate('AddAppointment', { 
              token, 
              userId, 
              selectedPatient: selectedPatient 
            });
          }}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Thêm lịch tái khám</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal chi tiết cuộc hẹn */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedAppointment && (
              <React.Fragment>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Ionicons name="calendar" size={48} color="#2563EB" />
                </View>
                <Text style={styles.modalTitle}>{selectedAppointment.title}</Text>
                <View style={styles.modalRow}>
                  <Ionicons name="business" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Bệnh viện: {selectedAppointment.hospital}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="location" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Địa điểm: {selectedAppointment.location}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="calendar" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Ngày: {new Date(selectedAppointment.date).toLocaleDateString()} - Giờ: {selectedAppointment.time}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="document-text" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Ghi chú: {selectedAppointment.notes || 'Không có ghi chú'}</Text>
                </View>
                <View style={styles.modalActions}>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity style={styles.modalActionBtn} onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={28} color="#2563EB" />
                    </TouchableOpacity>
                    <Text style={{ color: '#2563EB', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Đóng</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={async () => {
                        if (!selectedAppointment || !selectedPatient) return;
                        const token = await AsyncStorage.getItem('token');
                        if (!token) return;
                        try {
                          await RelativePatientService.deletePatientAppointment(selectedPatient._id, selectedAppointment._id, token);
                          setModalVisible(false);
                          setSelectedAppointment(null);
                          fetchAppointments(); // Refresh the list
                          alert('Đã xóa lịch tái khám thành công!');
                        } catch (error) {
                          console.error('Error deleting appointment:', error);
                          alert('Không thể xóa lịch tái khám. Vui lòng thử lại!');
                        }
                      }}
                    >
                      <Ionicons name="trash" size={28} color="#EF4444" />
                    </TouchableOpacity>
                    <Text style={{ color: '#EF4444', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Xóa</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={async () => {
                        if (!selectedAppointment) return;
                        const token = await AsyncStorage.getItem('token');
                        const userId = await AsyncStorage.getItem('userId');
                        setModalVisible(false);
                        navigation.navigate('EditAppointment', {
                          appointment: selectedAppointment,
                          token,
                          userId,
                          selectedPatient: selectedPatient, // Truyền người bệnh đã chọn
                        });
                      }}
                    >
                      <Ionicons name="pencil" size={28} color="#2563EB" />
                    </TouchableOpacity>
                    <Text style={{ color: '#2563EB', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Chỉnh sửa</Text>
                  </View>
                </View>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
  },
  modalActionBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 32,
    padding: 12,
    marginHorizontal: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  header: {
    backgroundColor: '#4A7BA7',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  addButtonText: {
    color: '#fff', 
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalIcon: {
    marginRight: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
  // Patient Selector Styles
  patientSelectorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  selectorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectorLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  refreshButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  patientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  patientSelectorText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  // Patient Modal Styles
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
});

export default AppointmentsRelative;
