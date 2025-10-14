import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import BPReminderService, { BloodPressureReminder } from '../api/BloodPressureReminder';

const BloodPressureSchedule = ({ navigation }: any) => {
  const [reminders, setReminders] = useState<BloodPressureReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<BloodPressureReminder | null>(null);
  const isFocused = useIsFocused();

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token) {
        setReminders([]);
        return;
      }

      const res = await BPReminderService.getBloodPressureReminders(token, userId || undefined);
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setReminders(list);
    } catch (err) {
      console.warn('Failed to load blood pressure reminders', err);
      setReminders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) fetchReminders();
  }, [isFocused, fetchReminders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReminders();
  };

  const renderItem = ({ item }: { item: BloodPressureReminder }) => {
    const firstTime = item.times && item.times.length > 0 ? item.times[0].time : undefined;
    let dateText = '-';
    if (firstTime) {
      const d = new Date(firstTime);
      if (!isNaN(d.getTime())) {
        const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dateText = `Ngày: ${date} - Giờ: ${time}`;
      } else {
        dateText = `${firstTime}`;
      }
    }

    const active = !!item.isActive;

    const RightActions = () => (
      <View style={styles.rightAction}>
        <RectButton style={[styles.rightActionBtn, { backgroundColor: active ? '#FEE2E2' : '#ECFDF5' }]} onPress={async () => {
          // toggle active
          try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            await BPReminderService.updateBloodPressureReminder(item._id!, { isActive: !active }, token);
            fetchReminders();
          } catch (err) {
            console.warn('Failed toggle isActive', err);
            Alert.alert('Lỗi', 'Không thể thay đổi trạng thái');
          }
        }}>
          <Ionicons name={active ? 'close' : 'checkmark'} size={22} color={active ? '#EF4444' : '#16A34A'} />
          <Text style={[styles.rightActionText, { color: active ? '#EF4444' : '#16A34A' }]}>{active ? 'Tắt' : 'Bật'}</Text>
        </RectButton>
      </View>
    );

    return (
      <Swipeable renderRightActions={RightActions} overshootRight={false}>
        <TouchableOpacity
          style={styles.reminderCard}
          onPress={() => openReminderDetail(item._id)}
        >
          <View style={styles.leftIcon}>
            <Ionicons name="heart" size={20} color="#fff" />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.title}>{item.note ? item.note : 'Lịch đo huyết áp'}</Text>
              <View style={[styles.activeBadge, { backgroundColor: active ? '#ECFDF5' : '#F3F4F6' }]}>
                <Text style={[styles.activeBadgeText, { color: active ? '#16A34A' : '#6B7280' }]}>{active ? 'Đang bật' : 'Tắt'}</Text>
              </View>
            </View>

            <Text style={styles.smallText}>{dateText}</Text>
            {item.note ? <Text style={styles.smallText}>Ghi chú: {item.note}</Text> : null}
            <Text style={styles.smallText}>Trạng thái: {item.status ?? (item.isActive ? 'active' : 'pending')}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const openReminderDetail = async (id?: string) => {
    if (!id) return;
    try {
      setDetailLoading(true);
      setModalVisible(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setSelectedDetail(null);
        return;
      }
      const res = await BPReminderService.getBloodPressureReminderById(id, token);
      const detail = res && res._id ? res : res?.data ?? null;
      setSelectedDetail(detail);
    } catch (err) {
      console.warn('Failed to load reminder detail', err);
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDetail?._id) return;
    
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa lịch đo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) return;
              // Gọi API xóa qua service
              await BPReminderService.deleteBloodPressureReminder(selectedDetail._id!, token);
              setModalVisible(false);
              setSelectedDetail(null);
              fetchReminders();
            } catch (err) {
              console.warn('Failed to delete reminder', err);
              Alert.alert('Lỗi', 'Không thể xóa lịch đo');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    setModalVisible(false);
    navigation.navigate('EditBloodPressure', { reminder: selectedDetail });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={[styles.emptyText, { marginTop: 12 }]}>Đang tải...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Không có lịch đo nào</Text>
          </View>
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(i) => i._id ?? Math.random().toString()}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBloodPressure')}
        >
          <Text style={styles.addButtonText}>+ Thêm lịch đo</Text>
        </TouchableOpacity>

        {/* Modal chi tiết - áp dụng cùng layout như AppointmentsScreen (giữ accent green) */}
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
              {detailLoading ? (
                <View style={{ padding: 28, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#16A34A" />
                </View>
              ) : selectedDetail ? (
                <React.Fragment>
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Ionicons name="heart" size={48} color="#16A34A" />
                  </View>

                  <Text style={styles.modalTitle}>{selectedDetail.note ?? 'Đã đến giờ đo huyết áp!'}</Text>

                  {/* Thời gian */}
                  {selectedDetail.times && selectedDetail.times.length > 0 && (
                    selectedDetail.times.map((t, idx) => {
                      const d = new Date(t.time);
                      const timeStr = !isNaN(d.getTime())
                        ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : t.time;
                      const label = t.label ?? (idx === 0 ? 'Sáng' : (idx === 1 ? 'Tối' : 'Thời gian'));
                      return (
                        <View key={idx} style={styles.modalRow}>
                          <Ionicons name="time-outline" size={20} color="#16A34A" style={styles.modalIcon} />
                          <Text style={styles.modalText}>{label}: {timeStr}</Text>
                        </View>
                      );
                    })
                  )}

                  {/* Ghi chú (nếu có) */}
                  {selectedDetail.note ? (
                    <View style={styles.modalRow}>
                      <Ionicons name="document-text" size={20} color="#16A34A" style={styles.modalIcon} />
                      <Text style={styles.modalText}>Ghi chú: {selectedDetail.note}</Text>
                    </View>
                  ) : null}

                  {/* Trạng thái */}
                  <View style={styles.modalRow}>
                    <Ionicons name="alert-circle" size={20} color="#16A34A" style={styles.modalIcon} />
                    <Text style={styles.modalText}>Trạng thái: {selectedDetail.status ?? 'pending'}</Text>
                  </View>

                  <View style={styles.modalActions}>
                    <View style={{ alignItems: 'center' }}>
                      <TouchableOpacity style={styles.modalActionBtn} onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={28} color="#16A34A" />
                      </TouchableOpacity>
                      <Text style={{ color: '#16A34A', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Đóng</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <TouchableOpacity
                        style={styles.modalActionBtn}
                        onPress={handleDelete}
                      >
                        <Ionicons name="trash" size={28} color="#EF4444" />
                      </TouchableOpacity>
                      <Text style={{ color: '#EF4444', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Xóa</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <TouchableOpacity
                        style={styles.modalActionBtn}
                        onPress={handleEdit}
                      >
                        <Ionicons name="pencil" size={28} color="#16A34A" />
                      </TouchableOpacity>
                      <Text style={{ color: '#16A34A', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Chỉnh sửa</Text>
                    </View>
                  </View>
                </React.Fragment>
              ) : (
                <View style={{ padding: 20 }}>
                  <Text style={styles.sectionValue}>Không có thông tin.</Text>
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F6FF' },
  content: { flex: 1, padding: 24 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 12, color: '#6B7280', fontSize: 16 },
  addButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  reminderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  leftIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  smallText: { color: '#6B7280', marginTop: 4 },
  
  // Modal styles - HIỂN THỊ Ở GIỮA (match Appointments modal)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  modalHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 15,
    color: '#111827',
    marginLeft: 10,
    fontWeight: '500',
  },
  
  // 3 nút hành động
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 12,
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
  modalIcon: {
    marginRight: 8,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rightActionBtn: {
    width: 88,
    height: '86%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8,
  },
  rightActionText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 80,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default BloodPressureSchedule;