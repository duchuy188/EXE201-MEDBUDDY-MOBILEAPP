import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, RefreshControl } from 'react-native';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReminderService, { Reminder } from '../api/Reminders';
import MedicationService from '../api/Medication'; // Sửa từ Medications thành Medication
import AsyncStorage from '@react-native-async-storage/async-storage';

const RemindersScreen = ({ navigation }: any) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchReminders().then(() => setRefreshing(false));
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Current token:', token);
      
      if (token) {
        console.log('Fetching reminders...');
        const response = await ReminderService.getReminders(token);
        setRawResponse(response);
        console.log('Full API response:', JSON.stringify(response, null, 2));
        
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
        console.log('No token found');
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
    fetchReminders();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchReminders();
    }, [])
  );

  const formatTimes = (times: { time: string }[]) => {
    return times.map(t => t.time).join(', ');
  };

  const formatDetailedTimes = (item: any) => {
    if (!item) return '';
    const labels = Array.isArray(item.times) ? item.times.map((t: any) => t.time) : [];
    const clocks = Array.isArray(item.repeatTimes) ? item.repeatTimes.map((r: any) => r.time) : [];
    const parts: string[] = [];
    const maxLen = Math.max(labels.length, clocks.length);
    for (let i = 0; i < maxLen; i++) {
      const lbl = labels[i];
      const clk = clocks[i];
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
      {/* Header with back button to Personal Info tab */}
      <View style={styles.headerInner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Thông tin cá nhân' })}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch nhắc</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
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
      <TouchableOpacity style={styles.addButton} onPress={async () => {
        console.log('Add button pressed'); // Debug log
        const token = await AsyncStorage.getItem('token');
        console.log('Token found:', !!token); // Debug log
        if (token) {
          try {
            console.log('Fetching medications...'); // Debug log
            const medications = await MedicationService.getMedications(token);
            console.log('Medications fetched:', medications?.length || 0); // Debug log
            console.log('Navigating to MedicationsScreen...'); // Debug log
            navigation.navigate('MedicationsScreen', { medications });
          } catch (error) {
            console.error('Error fetching medications:', error);
          }
        }
      }}>
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Thêm lịch nhắc</Text>
      </TouchableOpacity>

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
  headerInner: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#111827',
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
});

export default RemindersScreen;