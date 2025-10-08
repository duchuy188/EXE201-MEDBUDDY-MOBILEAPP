import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, RefreshControl, FlatList, ScrollView, Platform } from 'react-native';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ReminderService, { Reminder } from '../api/Reminders';
import MedicationService from '../api/Medication';
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

const RemindersRelative = ({ navigation }: any) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Patient selection states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchReminders().then(() => setRefreshing(false));
  }, [selectedPatient]);

  // Fetch patients function
  const fetchPatients = async () => {
    setPatientLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        console.log('Fetching patients with token:', token?.substring(0, 20) + '...');
        const patientsData = await RelativePatientService.getPatientsOfRelative(token);
        console.log('Raw patients response:', patientsData);
        
        let relationshipsList: PatientRelationship[] = [];
        if (Array.isArray(patientsData)) {
          relationshipsList = patientsData;
        } else if (patientsData && patientsData.data && Array.isArray(patientsData.data)) {
          relationshipsList = patientsData.data;
        } else if (patientsData && patientsData.patients && Array.isArray(patientsData.patients)) {
          relationshipsList = patientsData.patients;
        }
        
        const patientsList: Patient[] = relationshipsList.map((relationship) => ({
          _id: relationship.patient._id,
          fullName: relationship.patient.fullName,
          email: relationship.patient.email,
          phone: relationship.patient.phoneNumber,
          dateOfBirth: relationship.patient.dateOfBirth,
        }));
        
        console.log('Processed patients list:', patientsList);
        setPatients(patientsList);
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setPatientLoading(false);
    }
  };

  const fetchReminders = async () => {
    if (!selectedPatient) {
      setReminders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Current token:', token);
      
      if (token && selectedPatient) {
        console.log('Fetching reminders for patient:', selectedPatient._id);
        const response = await RelativePatientService.getPatientMedicationReminders(selectedPatient._id, token);
        console.log('Full API response:', JSON.stringify(response, null, 2));
        setRawResponse(response);
        
        // Kiểm tra cấu trúc response
        if (response) {
          if (Array.isArray(response)) {
            console.log('Response is an array, setting directly');
            setReminders(response);
          } else if (response.data && Array.isArray(response.data)) {
            console.log('Response has data array, setting from data');
            setReminders(response.data);
          } else if (response.reminders && Array.isArray(response.reminders)) {
            console.log('Response has reminders array, setting from reminders');
            setReminders(response.reminders);
          } else {
            console.log('Invalid response structure:', response);
            setReminders([]);
          }
        } else {
          console.log('No response data');
          setReminders([]);
        }
      } else {
        console.log('No token or selected patient found');
        setReminders([]);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
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
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchReminders();
    }
  }, [selectedPatient]);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedPatient) {
        fetchReminders();
      }
    }, [selectedPatient])
  );

  const formatTimes = (times: { time: string }[]) => {
    return times.map(t => t.time).join(', ');
  };

  // Format detailed times pairing label (Sáng/Chiều/Tối) with actual repeatTimes (HH:MM)
  const formatDetailedTimes = (item: any) => {
    if (!item) return '';
    const labels = Array.isArray(item.times) ? item.times.map((t: any) => t.time) : [];
    const clocks = Array.isArray(item.repeatTimes) ? item.repeatTimes.map((r: any) => r.time) : [];
    const maxLen = Math.max(labels.length, clocks.length);
    const parts: string[] = [];
    for (let i = 0; i < maxLen; i++) {
      const lbl = labels[i] || '';
      const clk = clocks[i] || '';
      if (lbl && clk) parts.push(`${lbl}: ${clk}`);
      else if (lbl) parts.push(lbl);
      else if (clk) parts.push(clk);
    }
    return parts.join(' • ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderReminder = ({ item }: { item: Reminder }) => (
    <TouchableOpacity
      style={styles.reminderCard}
      onPress={() => {
        setSelectedReminder(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="time" size={24} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>Lịch nhắc uống thuốc</Text>
          <Text style={styles.cardSubtitle}>Thời gian: {formatDetailedTimes(item)}</Text>
          <Text style={styles.cardSubtitle}>Từ ngày: {formatDate(item.startDate)} - Đến ngày: {formatDate(item.endDate)}</Text>
          <Text style={styles.cardSubtitle}>Loại: {item.reminderType === 'voice' ? 'Giọng nói' : 'Thông thường'}</Text>
          <Text style={styles.cardSubtitle}>Ghi chú: {item.note || 'Không có ghi chú'}</Text>
          <Text style={styles.cardSubtitle}>Trạng thái: {item.isActive ? 'Đang hoạt động' : 'Tạm dừng'}</Text>
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
            <MaterialIcons name="refresh" size={20} color="#F59E0B" />
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
          <MaterialIcons name="arrow-drop-down" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>
      
      {!selectedPatient ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chọn người bệnh để xem lịch nhắc</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={styles.loader} />
      ) : reminders.length > 0 ? (
        <FlatList
          data={reminders}
          renderItem={renderReminder}
          keyExtractor={(item) => item._id || ''}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#F59E0B']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="time" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Không có lịch nhắc nào</Text>
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
        <TouchableOpacity style={styles.addButton} onPress={async () => {
          console.log('Add button pressed');
          const token = await AsyncStorage.getItem('token');
          console.log('Token found:', !!token);
          if (token && selectedPatient) {
            try {
              console.log('Fetching medications...');
              const medications = await MedicationService.getMedications(token);
              console.log('Medications fetched:', medications?.length || 0);
              console.log('Navigating to MedicationsScreen...');
              navigation.navigate('MedicationsScreen', { 
                medications,
                selectedPatient: selectedPatient 
              });
            } catch (error) {
              console.error('Error fetching medications:', error);
            }
          }
        }}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Thêm lịch nhắc</Text>
        </TouchableOpacity>
      )}

      {/* Modal chi tiết lịch nhắc */}
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
            {selectedReminder && (
              <React.Fragment>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Ionicons name="time" size={48} color="#F59E0B" />
                </View>
                <Text style={styles.modalTitle}>Chi tiết lịch nhắc</Text>
                <View style={styles.modalRow}>
                  <Ionicons name="time" size={20} color="#F59E0B" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Thời gian: {formatDetailedTimes(selectedReminder)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="calendar" size={20} color="#F59E0B" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Từ ngày: {formatDate(selectedReminder.startDate)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="calendar" size={20} color="#F59E0B" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Đến ngày: {formatDate(selectedReminder.endDate)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="volume-high" size={20} color="#F59E0B" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Loại: {selectedReminder.reminderType === 'voice' ? 'Giọng nói' : 'Thông thường'}</Text>
                </View>
                {selectedReminder.voice && (
                  <View style={styles.modalRow}>
                    <Ionicons name="person" size={20} color="#F59E0B" style={styles.modalIcon}/>
                    <Text style={styles.modalText}>Giọng nói: {selectedReminder.voice}</Text>
                  </View>
                )}
                <View style={styles.modalRow}>
                  <Ionicons name="document-text" size={20} color="#F59E0B" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Ghi chú: {selectedReminder.note || 'Không có ghi chú'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#F59E0B" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Trạng thái: {selectedReminder.isActive ? 'Đang hoạt động' : 'Tạm dừng'}</Text>
                </View>
                <View style={styles.modalActions}>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity style={styles.modalActionBtn} onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={28} color="#F59E0B" />
                    </TouchableOpacity>
                    <Text style={{ color: '#F59E0B', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Đóng</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={async () => {
                        if (!selectedReminder) return;
                        const token = await AsyncStorage.getItem('token');
                        if (!token) return;
                        try {
                          await ReminderService.deleteReminder(selectedReminder._id!, token);
                          setModalVisible(false);
                          setSelectedReminder(null);
                          fetchReminders();
                        } catch (error) {
                          console.error('Error deleting reminder:', error);
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
                        if (!selectedReminder) return;
                        const token = await AsyncStorage.getItem('token');
                        const userId = await AsyncStorage.getItem('userId');
                        setModalVisible(false);
                        navigation.navigate('EditReminder', {
                          reminder: selectedReminder,
                          reminderId: selectedReminder._id,
                          token,
                          userId,
                          selectedPatient: selectedPatient,
                          // Pass the raw API response so the edit screen can inspect repeatTimes/times etc.
                          fullResponse: rawResponse,
                        });
                      }}
                    >
                      <Ionicons name="pencil" size={28} color="#F59E0B" />
                    </TouchableOpacity>
                    <Text style={{ color: '#F59E0B', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Chỉnh sửa</Text>
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
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#F59E0B',
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
    marginBottom: 2,
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
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 8,
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
    marginTop: 16,
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
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
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

export default RemindersRelative;