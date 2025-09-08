import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Pressable, Image } from 'react-native';
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

const timeSlots: { id: string; label: string; icon: string }[] = [
  { id: 'morning', label: 'Sáng', icon: '🌅' },
  { id: 'afternoon', label: 'Chiều', icon: '☀️' },
  { id: 'evening', label: 'Tối', icon: '🌙' },
];

const MedicationsScreen = ({ route, navigation }: any) => {
  const { medications, token, userId } = route.params;

  console.log('MedicationsScreen received token:', token);
  console.log('MedicationsScreen received userId:', userId);

  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [medicationsList, setMedicationsList] = useState<Medication[]>(medications);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleTimeSlot = (timeId: string) => {
    setSelectedTimes((prev) =>
      prev.includes(timeId) ? prev.filter((id) => id !== timeId) : [...prev, timeId]
    );
  };

  const openEditModal = (item: Medication) => {
    console.log('Opening edit modal for medication:', item);
    setSelectedMedication(item);
    setSelectedTimes(item.timeOfDay.split(','));
    setModalVisible(true);
  };

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
    <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => openEditModal(item)}
    >
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

  const fetchMedications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      const updatedMedications = await MedicationService.getMedications(token);
      setMedicationsList(updatedMedications);
    } catch (error) {
      console.error('Error fetching medications:', error);
      alert('Không thể lấy danh sách thuốc mới!');
    }
  };

  const saveMedicationChanges = async () => {
    if (selectedMedication) {
      if (!selectedMedication.name.trim() || !selectedMedication.dosage.trim()) {
        alert('Tên thuốc và liều lượng không được bỏ trống!');
        return;
      }

      const updatedData = {
        name: selectedMedication.name,
        dosage: selectedMedication.dosage,
        note: selectedMedication.note,
        timeOfDay: selectedTimes.join(','),
      };

      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Không tìm thấy token');

        await MedicationService.updateMedication(selectedMedication._id, updatedData, token);
        setModalVisible(false);
        alert('Cập nhật thành công!');
        await fetchMedications();
      } catch (error) {
        console.error('Error updating medication:', error);
        alert('Cập nhật thất bại!');
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
        console.log('Screen focused, fetching medications...');
        fetchMedications();
    }, [])
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
        onPress={async () => {
          try {
            console.log('Attempting to retrieve token and userId from AsyncStorage...');

            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');

            console.log('Token retrieved:', token);
            console.log('UserId retrieved:', userId);

            if (!token || !userId) {
              console.error('Token or userId is missing.');
              throw new Error('Không tìm thấy thông tin đăng nhập');
            }

            console.log('Navigating to AddMedicine with token and userId:', token, userId);
            navigation.navigate('AddMedicine', { token, userId });
          } catch (error) {
            console.error('Error retrieving token or userId:', error);
            alert('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
          }
        }}
      >
        <Text style={styles.addButtonText}>+ Thêm thuốc</Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainerSmall}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin thuốc</Text>
            
            <Text style={styles.label}>Tên thuốc</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Amlodipine"
              value={selectedMedication?.name}
              onChangeText={(text) => setSelectedMedication({ ...selectedMedication!, name: text })}
            />

            <Text style={styles.label}>Liều lượng</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 1 viên"
              value={selectedMedication?.dosage}
              onChangeText={(text) => setSelectedMedication({ ...selectedMedication!, dosage: text })}
            />

            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Uống sau ăn"
              value={selectedMedication?.note}
              onChangeText={(text) => setSelectedMedication({ ...selectedMedication!, note: text })}
            />

            <Text style={styles.label}>Thời gian</Text>
            <View style={styles.timeSlotsContainer}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.timeBtn, selectedTimes.includes(slot.id) && styles.timeBtnSelected]}
                  onPress={() => toggleTimeSlot(slot.id)}
                >
                  <Text style={styles.timeBtnIcon}>{slot.icon}</Text>
                  <Text style={styles.timeBtnLabel}>{slot.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Lưu" onPress={saveMedicationChanges} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainerSmall: {
    width: '80%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FF3B30',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
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
