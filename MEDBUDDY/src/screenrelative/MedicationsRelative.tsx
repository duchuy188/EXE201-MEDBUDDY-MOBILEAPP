import React, { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Pressable, Image, Alert } from 'react-native';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

interface MedicationTime {
  time: string; // "Sáng", "Chiều", "Tối"
  dosage: string; // Liều lượng
  _id?: string;
}

interface Medication {
  _id: string;
  userId: string;
  name: string;
  quantity?: string;
  form?: string;
  image?: string;
  note?: string;
  totalQuantity?: number;
  remainingQuantity?: number;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  times: MedicationTime[]; // Mảng các buổi uống và liều lượng
  expirationDate?: string;
  createdAt?: string;
}

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

const MedicationsRelative = ({ route, navigation }: any) => {
  const [token, setToken] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const medications = route.params?.medications;
  
  // Patient selection states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientRelationships, setPatientRelationships] = useState<PatientRelationship[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // Lấy token và userId từ route.params hoặc AsyncStorage
  React.useEffect(() => {
    const loadAuthData = async () => {
      try {
        // Thử lấy từ route.params trước
        let currentToken = route.params?.token;
        let currentUserId = route.params?.userId;

        // Nếu không có trong route.params, lấy từ AsyncStorage
        if (!currentToken) {
          currentToken = await AsyncStorage.getItem('token');
        }
        if (!currentUserId) {
          currentUserId = await AsyncStorage.getItem('userId');
        }

        console.log('Token loaded:', currentToken);
        console.log('UserId loaded:', currentUserId);

        if (currentToken) {
          setToken(currentToken);
          // Fetch patients when token is available
          await fetchPatients(currentToken);
        }
        if (currentUserId) setUserId(currentUserId);

        if (!currentToken || !currentUserId) {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
      }
    };

    loadAuthData();
  }, [route.params]);

  const [medicationsList, setMedicationsList] = useState<Medication[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Fetch patients function
  const fetchPatients = async (currentToken: string) => {
    try {
      console.log('Fetching patients with token:', currentToken?.substring(0, 20) + '...');
      const patientsData = await RelativePatientService.getPatientsOfRelative(currentToken);
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
        email: relationship.patient.email,
        fullName: relationship.patient.fullName,
        phone: relationship.patient.phoneNumber,
        dateOfBirth: relationship.patient.dateOfBirth,
      }));
      
      console.log('Processed patients list:', patientsList);
      setPatientRelationships(relationshipsList);
      setPatients(patientsList);
      
      if (patientsList.length === 0) {
        console.log('No patients found. You may need to add patients first using the addPatientRelative API.');
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      console.error('Error details:', error.response?.data || error.message);
      Alert.alert('Lỗi', `Không thể lấy danh sách người bệnh: ${error.response?.data?.message || error.message}`);
    }
  };

  // Modal state for editing/viewing medication
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMedication, setModalMedication] = useState<Medication | null>(null);
  // Form states for modal
  const [modalName, setModalName] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [modalDate, setModalDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === medicationsList.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(medicationsList.map((item) => item._id));
    }
  };

  const deleteSelectedItems = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !selectedPatient?._id) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin xác thực hoặc người bệnh');
        return;
      }

      await Promise.all(
        selectedItems.map((id) => RelativePatientService.deletePatientMedication(selectedPatient._id, id, token))
      );

      Alert.alert('Thành công', 'Xóa thuốc thành công!');
      await fetchMedications();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error deleting medications:', error);
      Alert.alert('Lỗi', 'Xóa thuốc thất bại!');
    }
  };

  const renderMedicationItem = ({ item }: { item: Medication }) => {
    console.log('Rendering medication item:', JSON.stringify(item, null, 2));
    return (
      <TouchableOpacity style={styles.itemContainer} onPress={() => {
        setModalMedication(item);
        setModalName(item.name);
        setModalNote(item.note || '');
        setModalDate(item.createdAt ? new Date(item.createdAt) : new Date());
        setModalVisible(true);
      }}>
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>Tên thuốc: {item.name}</Text>
          <Text style={styles.itemDetail}>
            Dạng: {item.form || 'Không xác định'} - Số lượng: {item.remainingQuantity || 0} {item.form || 'viên'}
          </Text>
          <Text style={styles.itemDetail}>
            Lịch uống: {
              item.times && Array.isArray(item.times) && item.times.length > 0
                ? item.times.map((t) => `${t.time} (${t.dosage})`).join(', ')
                : 'Chưa có lịch'
            }
          </Text>
          <Text style={styles.itemDetail}>
            Ngày thêm vào: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Không xác định'}
          </Text>
          <Text style={styles.itemDetail}>Ghi chú: {item.note || 'chưa có ghi chú'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const fetchMedications = React.useCallback(async () => {
    try {
      if (!token || !selectedPatient?._id) {
        console.error('Token or selected patient not found');
        return;
      }

      console.log('Fetching medications for patient ID:', selectedPatient._id);
      const updatedMedications = await RelativePatientService.getPatientMedications(selectedPatient._id, token);
      console.log('Raw medications response:', updatedMedications);
      console.log('Medications response type:', typeof updatedMedications);
      console.log('Is array?', Array.isArray(updatedMedications));
      
      // Handle different possible response structures
      let medicationsList = [];
      if (Array.isArray(updatedMedications)) {
        medicationsList = updatedMedications;
      } else if (updatedMedications && updatedMedications.data && Array.isArray(updatedMedications.data)) {
        medicationsList = updatedMedications.data;
      } else if (updatedMedications && updatedMedications.medications && Array.isArray(updatedMedications.medications)) {
        medicationsList = updatedMedications.medications;
      }
      
      console.log('Processed medications list:', medicationsList);
      console.log('Medications count:', medicationsList.length);
      
      setMedicationsList(medicationsList);
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Lỗi', 'Không thể lấy danh sách thuốc mới!');
    }
  }, [token, selectedPatient]);

  useFocusEffect(
    React.useCallback(() => {
        console.log('Screen focused, fetching medications with token:', token, 'selectedPatient:', selectedPatient);
        if (token && selectedPatient) {
            fetchMedications();
        }
    }, [token, selectedPatient, fetchMedications])
  );

  return (
    <View style={styles.container}>
      {/* Patient Selector */}
      <View style={styles.patientSelectorContainer}>
        <View style={styles.selectorHeaderRow}>
          <Text style={styles.selectorLabel}>Chọn người bệnh:</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              if (token) {
                fetchPatients(token);
              }
            }}
          >
            <MaterialIcons name="refresh" size={20} color="#4A7BA7" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.patientSelector}
          onPress={() => setShowPatientSelector(true)}
        >
          <Text style={styles.patientSelectorText}>
            {selectedPatient 
              ? (selectedPatient.fullName 
                  ? `${selectedPatient.fullName}` 
                  : selectedPatient.email)
              : 'Chọn người bệnh'
            }
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#4A7BA7" />
        </TouchableOpacity>
      </View>

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
                    setMedicationsList([]); // Clear current medications
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
                      Sinh nhật: {new Date(item.dateOfBirth).toLocaleDateString('vi-VN')}
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

      {/* Header Buttons */}
      {selectedPatient && (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.lowStockButton}
            onPress={() => {
              if (selectedPatient) {
                // Navigate to low stock screen for this patient
                navigation.navigate('LowStockRelative', { 
                  patientId: selectedPatient._id,
                  patientName: selectedPatient.fullName 
                });
              }
            }}
          >
            <MaterialIcons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.lowStockButtonText}>Thuốc sắp hết</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectedPatient ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../../assets/pill-icon.png')}
            style={styles.icon}
          />
          <Text style={styles.emptyMessage}>Vui lòng chọn người bệnh để xem danh sách thuốc</Text>
          <Text style={styles.emptySubMessage}>
            {patients.length === 0 
              ? 'Chưa có người bệnh nào được thêm. Hãy thêm người bệnh mới để bắt đầu.'
              : 'Hãy chọn một người bệnh từ danh sách trên.'
            }
          </Text>
          {patients.length === 0 && (
            <TouchableOpacity
              style={styles.addPatientMainButton}
              onPress={() => navigation.navigate('AddRelative')}
            >
              <MaterialIcons name="person-add" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addPatientMainButtonText}>Thêm người bệnh đầu tiên</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : medicationsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../../assets/pill-icon.png')}
            style={styles.icon}
          />
          <Text style={styles.emptyMessage}>Hãy thêm thuốc</Text>
        </View>
      ) : (
        <>
          {medicationsList.length > 1 && (
            <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
              <Text style={styles.selectAllText}>
                {selectedItems.length === medicationsList.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={medicationsList}
            keyExtractor={(item) => item._id}
            renderItem={renderMedicationItem}
          />
          {selectedItems.length > 0 && (
            <TouchableOpacity style={styles.deleteButton} onPress={deleteSelectedItems}>
              <MaterialIcons name="delete" size={24} color="#fff" />
              <Text style={styles.deleteButtonText}>Xóa</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (!token || !userId) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
            return;
          }
          navigation.navigate('AddMedicine', { token, userId });
        }}
      >
        <Text style={styles.addButtonText}>+ Thêm thuốc</Text>
      </TouchableOpacity>

      {/* Modal for medication info (edit/view) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 22, width: '90%', alignItems: 'center', borderWidth: 1.5, borderColor: '#B6D5FA', shadowColor: '#F0F6FF', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
              <View style={{ width: 40 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', flex: 1 }}>Thông tin thuốc</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 40, alignItems: 'flex-end' }}>
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {/* Info fields with icon */}
            <View style={{ width: '100%', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="medication" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Tên thuốc:</Text>
                <Text style={{ color: '#1E293B', fontWeight: 'bold' }}>{modalMedication?.name || modalName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="medical-services" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Dạng thuốc:</Text>
                <Text style={{ color: '#1E293B' }}>{modalMedication?.form || 'Không xác định'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="format-list-numbered" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Số lượng:</Text>
                <Text style={{ color: '#1E293B' }}>{modalMedication?.remainingQuantity || 0} {modalMedication?.form || 'viên'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <MaterialIcons name="schedule" size={22} color="#3B82F6" style={{ marginRight: 8, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#64748B', fontWeight: '500', marginBottom: 4 }}>Lịch uống:</Text>
                  {modalMedication?.times && modalMedication.times.length > 0 ? (
                    modalMedication.times.map((timeSlot, index) => (
                      <Text key={index} style={{ color: '#1E293B', marginLeft: 8, marginBottom: 2 }}>
                        • {timeSlot.time}: {timeSlot.dosage}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: '#1E293B', marginLeft: 8 }}>Chưa có lịch uống</Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="calendar-today" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Ngày thêm vào:</Text>
                <Text style={{ color: '#1E293B' }}>
                  {modalMedication?.createdAt 
                    ? new Date(modalMedication.createdAt).toLocaleDateString('vi-VN')
                    : modalDate.toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="notes" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Ghi chú:</Text>
                <Text style={{ color: '#1E293B', flex: 1 }}>{modalMedication?.note || modalNote || 'Chưa có ghi chú'}</Text>
              </View>
            </View>
            {/* Icon button group */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 16, width: '100%' }}>
              <TouchableOpacity onPress={() => {
                // Xóa thuốc
                (async () => {
                  try {
                    if (!modalMedication?._id || !selectedPatient?._id) throw new Error('Không tìm thấy thông tin thuốc hoặc người bệnh');
                    const token = await AsyncStorage.getItem('token');
                    if (!token) throw new Error('Không tìm thấy token');
                    await RelativePatientService.deletePatientMedication(selectedPatient._id, modalMedication._id, token);
                    Alert.alert('Xóa', 'Đã xóa thuốc này');
                    setModalVisible(false);
                    // Cập nhật lại danh sách
                    await fetchMedications();
                  } catch (err) {
                    Alert.alert('Lỗi', 'Xóa thuốc thất bại!');
                  }
                })();
              }} style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                  <MaterialIcons name="delete" size={28} color="#EF4444" />
                </View>
                <Text style={{ color: '#EF4444', marginTop: 4, fontWeight: '500' }}>Xóa</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                navigation.navigate('EditMedicine', { medicine: modalMedication });
              }} style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                  <MaterialIcons name="edit" size={28} color="#F59E0B" />
                </View>
                <Text style={{ color: '#F59E0B', marginTop: 4, fontWeight: '500' }}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignItems: 'center' }}>
                <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => {
                  if (!token || !userId) {
                    Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
                    return;
                  }
                  setModalVisible(false);
                  navigation.navigate('AddReminder', {
                    token,
                    userId,
                    medication: modalMedication,
                    selectedPatient: selectedPatient
                  });
                }}>
                  <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                    <MaterialIcons name="access-time" size={28} color="#8B5CF6" />
                  </View>
                  <Text style={{ color: '#8B5CF6', marginTop: 4, fontWeight: '500' }}>Giờ uống</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
            
            {/* Second row of buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 12, width: '100%' }}>
              {/* Set threshold button */}
              <TouchableOpacity 
                style={{ alignItems: 'center' }}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('SetThresholdRelative', { 
                    medication: modalMedication,
                    patientId: selectedPatient?._id,
                    onSuccess: fetchMedications
                  });
                }}
              >
                <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                  <MaterialIcons name="settings" size={28} color="#06B6D4" />
                </View>
                <Text style={{ color: '#06B6D4', marginTop: 4, fontWeight: '500' }}>Đặt ngưỡng</Text>
              </TouchableOpacity>

              {/* Add stock button */}
              <TouchableOpacity 
                style={{ alignItems: 'center' }}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('AddStockRelative', { 
                    medication: modalMedication,
                    patientId: selectedPatient?._id,
                    onSuccess: fetchMedications
                  });
                }}
              >
                <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                  <MaterialIcons name="add-shopping-cart" size={28} color="#10B981" />
                </View>
                <Text style={{ color: '#10B981', marginTop: 4, fontWeight: '500' }}>Mua thêm</Text>
              </TouchableOpacity>
            </View>
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={(date) => {
                setModalDate(date);
                setShowDatePicker(false);
              }}
              onCancel={() => setShowDatePicker(false)}
              minimumDate={new Date()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F0F6FF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  // Patient Selector Styles
  patientSelectorContainer: {
    marginBottom: 16,
  },
  selectorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Header Buttons Styles
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  lowStockButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  lowStockButtonText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  refreshButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  debugButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  debugButtonText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  patientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
  emptyPatientsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    padding: 20,
  },
  emptyPatientsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
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
  timeBtnIcon: {
    fontSize: 22,
  },
  timeBtnLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  addButton: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  addButtonText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 18,
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  itemContent: {
    flex: 1,
  },
  selectAllButton: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  selectAllText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  emptySubMessage: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  addPatientMainButton: {
    flexDirection: 'row',
    backgroundColor: '#4A7BA7',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addPatientMainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    width: 200,
    height: 200,
  },
});

export default MedicationsRelative;