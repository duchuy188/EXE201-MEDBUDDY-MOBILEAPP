
import React, { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Pressable, Image, Alert } from 'react-native';
import MedicationService from '../api/Medication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

interface Medication {
  _id: string;
  name: string;
  dosage: string;
  timeOfDay: string;
  createdAt: string;
  note?: string;
}

const MedicationsScreen = ({ route, navigation }: any) => {
  const [token, setToken] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const medications = route.params?.medications;

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

        if (currentToken) setToken(currentToken);
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

  // Modal state for editing/viewing medication
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMedication, setModalMedication] = useState<Medication | null>(null);
  // Form states for modal
  const [modalName, setModalName] = useState('');
  const [modalDosage, setModalDosage] = useState('');
  const [modalTimeOfDay, setModalTimeOfDay] = useState('');
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
      if (!token) throw new Error('Không tìm thấy token');

      await Promise.all(
        selectedItems.map((id) => MedicationService.deleteMedication(id, token))
      );

      alert('Xóa thành công!');
      await fetchMedications();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error deleting medications:', error);
      alert('Xóa thất bại!');
    }
  };

  const renderMedicationItem = ({ item }: { item: Medication }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => {
      setModalMedication(item);
      setModalName(item.name);
      setModalDosage(item.dosage);
      setModalTimeOfDay(item.timeOfDay);
      setModalNote(item.note || '');
      setModalDate(new Date(item.createdAt));
      setModalVisible(true);
    }}>
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>Tên thuốc: {item.name}</Text>
        <Text style={styles.itemDetail}>Liều lượng: {item.dosage}</Text>
        <Text style={styles.itemDetail}>Thời gian: {
          item.timeOfDay
            .split(',')
            .map((time: string) => {
              switch (time) {
                case 'morning':
                  return 'Sáng';
                case 'afternoon':
                  return 'Chiều';
                case 'evening':
                  return 'Tối';
                default:
                  return time;
              }
            })
            .join(', ')
        }</Text>
        <Text style={styles.itemDetail}>Ngày thêm vào: {new Date(item.createdAt).toLocaleDateString('vi-VN') || 'Không xác định'}</Text>
        <Text style={styles.itemDetail}>Ghi chú: {item.note || 'chưa có ghi chú'}</Text>
      </View>
    </TouchableOpacity>
);

  const fetchMedications = React.useCallback(async () => {
    try {
      if (!token) {
        console.error('Token not found in state');
        return;
      }

      const updatedMedications = await MedicationService.getMedications(token);
      setMedicationsList(updatedMedications);
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Lỗi', 'Không thể lấy danh sách thuốc mới!');
    }
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
        console.log('Screen focused, fetching medications with token:', token);
        if (token) {
            fetchMedications();
        }
    }, [token])
);

  return (
  <View style={styles.container}>
  {medicationsList.length === 0 ? (
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
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 16, textAlign: 'center' }}>Thông tin thuốc</Text>
            {/* Info fields with icon */}
            <View style={{ width: '100%', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="medication" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Tên thuốc:</Text>
                <Text style={{ color: '#1E293B', fontWeight: 'bold' }}>{modalName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="format-list-numbered" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Liều lượng:</Text>
                <Text style={{ color: '#1E293B' }}>{modalDosage}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="schedule" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Thời gian:</Text>
                <Text style={{ color: '#1E293B' }}>{modalTimeOfDay
                  .split(',')
                  .map((time) => {
                    switch (time.trim()) {
                      case 'morning': return 'Sáng';
                      case 'afternoon': return 'Chiều';
                      case 'evening': return 'Tối';
                      default: return time;
                    }
                  })
                  .join(', ')
                }</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="calendar-today" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Ngày thêm vào:</Text>
                <Text style={{ color: '#1E293B' }}>{modalDate.toLocaleDateString('vi-VN')}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="notes" size={22} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#64748B', fontWeight: '500', marginRight: 8 }}>Ghi chú:</Text>
                <Text style={{ color: '#1E293B', flex: 1 }}>{modalNote}</Text>
              </View>
            </View>
            {/* Icon button group */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 16, width: '100%' }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                  <MaterialIcons name="close" size={28} color="#3B82F6" />
                </View>
                <Text style={{ color: '#3B82F6', marginTop: 4, fontWeight: '500' }}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                // Xóa thuốc
                (async () => {
                  try {
                    if (!modalMedication?._id) throw new Error('Không tìm thấy id thuốc');
                    const token = await AsyncStorage.getItem('token');
                    if (!token) throw new Error('Không tìm thấy token');
                    await MedicationService.deleteMedication(modalMedication._id, token);
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
                  <MaterialIcons name="edit" size={28} color="#3B82F6" />
                </View>
                <Text style={{ color: '#3B82F6', marginTop: 4, fontWeight: '500' }}>Sửa</Text>
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
                    medication: modalMedication
                  });
                }}>
                  <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                    <MaterialIcons name="access-time" size={28} color="#3B82F6" />
                  </View>
                  <Text style={{ color: '#3B82F6', marginTop: 4, fontWeight: '500' }}>Giờ uống</Text>
                </TouchableOpacity>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
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
    fontSize: 40,
    color: '#6b7280',
    marginBottom: 20,
  },
  icon: {
    width: 200,
    height: 200,
  },
});

export default MedicationsScreen;
