import React, { useState } from 'react';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Pressable, Image, Alert, ScrollView } from 'react-native';
import MedicationService from '../api/Medication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

interface MedicationTime {
  time: string; // "Sáng", "Chiều", "Tối"
  dosage: string; // Liều lượng
  _id?: string;
}

interface Medication {
  _id?: string;
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

  // Sort helper: newest createdAt first
  const sortMedicationsNewestFirst = (list: Medication[] | undefined | null) => {
    if (!list || !Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const aCreated = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bCreated = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bCreated - aCreated; // newer first
    });
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
      setSelectedItems(medicationsList.map((item) => item._id || Math.random().toString()));
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

  const renderMedicationItem = ({ item }: { item: Medication }) => {
    console.log('Rendering medication item:', JSON.stringify(item, null, 2));
    
    // Helper function to safely render times
    const getTimesText = () => {
      if (!item.times || !Array.isArray(item.times) || item.times.length === 0) {
        return 'Chưa có lịch';
      }
      
      try {
        const timesArray = item.times.map((timeItem, index) => {
          if (typeof timeItem === 'string') {
            return timeItem;
          }
          if (timeItem && typeof timeItem === 'object') {
            const time = timeItem.time || '';
            const dosage = timeItem.dosage || '';
            return `${time} (${dosage})`;
          }
          return 'Không xác định';
        });
        return timesArray.join(', ');
      } catch (error) {
        console.error('Error processing times:', error);
        return 'Lỗi hiển thị lịch';
      }
    };

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
            Lịch uống: {getTimesText()}
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
      if (!token) {
        console.error('Token not found in state');
        return;
      }

      const updatedMedications = await MedicationService.getMedications(token);
      setMedicationsList(sortMedicationsNewestFirst(updatedMedications));
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Lỗi', 'Không thể lấy danh sách thuốc mới!');
    }
  }, [token]);

  // Initialize medicationsList from route params (sorted newest first)
  React.useEffect(() => {
    if (medications && Array.isArray(medications)) {
      setMedicationsList(sortMedicationsNewestFirst(medications));
    }
  }, [medications]);

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
          {/* Header buttons */}
          <View style={styles.headerButtons}>
            {medicationsList.length > 1 && (
              <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
                <Text style={styles.selectAllText}>
                  {selectedItems.length === medicationsList.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Low stock button */}
            <TouchableOpacity 
              style={styles.lowStockButton}
              onPress={() => {
                navigation.navigate('LowStock');
              }}
            >
              <MaterialIcons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.lowStockButtonText}>Thuốc sắp hết</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={medicationsList}
            keyExtractor={(item) => item._id || Math.random().toString()}
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
          {/* Container with maxHeight so content can scroll when long */}
          <View style={{ width: '90%', maxHeight: '80%', borderRadius: 24, overflow: 'hidden' }}>
            <ScrollView contentContainerStyle={{ backgroundColor: '#fff', padding: 22, alignItems: 'center', borderWidth: 1.5, borderColor: '#B6D5FA', shadowColor: '#F0F6FF', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 }}>
              {/* Header with close button */}
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
                    <Text style={{ color: '#1E293B', fontSize: 16 }}>
                      {modalMedication?.times && Array.isArray(modalMedication.times) && modalMedication.times.length > 0 
                        ? modalMedication.times.map((t, index) => {
                            if (typeof t === 'string') return t;
                            if (t && typeof t === 'object') {
                              return `${t.time || ''} (${t.dosage || ''})`;
                            }
                            return 'Không xác định';
                          }).join(', ')
                        : 'Chưa có lịch uống'
                      }
                    </Text>
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
                  navigation.navigate('EditMedicine', { 
                    medicine: modalMedication,
                    onSuccess: fetchMedications
                  });
                }} style={{ alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                    <MaterialIcons name="edit" size={28} color="#F59E0B" />
                  </View>
                  <Text style={{ color: '#F59E0B', marginTop: 4, fontWeight: '500' }}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
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
                }} style={{ alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                    <MaterialIcons name="access-time" size={28} color="#8B5CF6" />
                  </View>
                  <Text style={{ color: '#8B5CF6', marginTop: 4, fontWeight: '500' }}>Giờ uống</Text>
                </TouchableOpacity>
              </View>
              
              {/* Second row of buttons */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 12, width: '100%' }}>
                {/* Set threshold button */}
                <TouchableOpacity 
                  style={{ alignItems: 'center' }}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('SetThreshold', { 
                      medication: modalMedication,
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
                    navigation.navigate('AddStock', { 
                      medication: modalMedication,
                      onSuccess: fetchMedications
                    });
                  }}
                >
                  <View style={{ backgroundColor: '#F6F8FB', borderRadius: 50, padding: 16 }}>
                    <MaterialIcons name="medication" size={28} color="#10B981" />
                  </View>
                  <Text style={{ color: '#10B981', marginTop: 4, fontWeight: '500' }}>Thêm thuốc</Text>
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
            </ScrollView>
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
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  selectAllButton: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  selectAllText: {
    color: '#0EA5E9',
    fontWeight: 'bold',
    fontSize: 16,
  },
  lowStockButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  lowStockButtonText: {
    color: '#92400E',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
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