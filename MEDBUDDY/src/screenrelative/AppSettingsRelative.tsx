import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, SafeAreaView, Modal, TextInput, Button, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBloodPressureReminder } from '../api/BloodPressureReminder';
import { updateBloodPressureReminder } from '../api/BloodPressureReminder';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const AppSettingsRelative = ({ navigation }: any) => {
  const [reminderId, setReminderId] = useState<string | null>(null);
  const defaultFontSize = 100;
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [isBpReminderActive, setIsBpReminderActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Lấy token từ AsyncStorage khi mở modal
  React.useEffect(() => {
    if (modalVisible) {
      (async () => {
        const t = await AsyncStorage.getItem('token');
        setToken(t);
      })();
    }
  }, [modalVisible]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backButton, { width: 80 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
            <Text style={{ color: '#1a1a1a', marginLeft: 4, fontWeight: '500' }}>Quay lại</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Cài đặt</Text>
        </View>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* CHUNG */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CHUNG</Text>
          <View style={styles.menuItem}>
            <View style={{flex: 1}}>
              <Text style={styles.menuTitle}>Cỡ chữ</Text>
              <Text style={styles.menuSubtitle}>Điều chỉnh kích thước chữ cho toàn bộ ứng dụng</Text>
            </View>
            <View style={styles.fontSizeControl}>
              <TouchableOpacity 
                style={styles.fontSizeButton}
                onPress={() => setFontSize(prev => Math.max(50, prev - 10))}
              >
                <Text style={styles.fontSizeButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeValue}>{Math.round(fontSize)}%</Text>
              <TouchableOpacity 
                style={styles.fontSizeButton}
                onPress={() => setFontSize(prev => Math.min(300, prev + 10))}
              >
                <Text style={styles.fontSizeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
{/* <TouchableOpacity 
  style={styles.menuItem}
  onPress={() => navigation.navigate('PackageHistory')}
>
  <Text style={styles.menuTitle}>Xem lịch sử thanh toán</Text>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity> */}
        </View>

        {/* CÀI ĐẶT NÂNG CAO */}
<View style={styles.section}>
  <Text style={styles.sectionHeader}>CÀI ĐẶT NÂNG CAO</Text>
    {/* <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('CurrentPackage')}
  >
    <Text style={styles.menuTitle}>Xem gói hiện tại</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity> */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('PackageScreen')}
  >
    <Text style={styles.menuTitle}>Nâng cấp tài khoản</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>
</View>

        {/* Nhắc nhở đo huyết áp */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>NHẮC NHỞ ĐO HUYẾT ÁP</Text>
          <View style={styles.menuItem}>
            <View>
              <Text style={styles.menuTitle}>Nhắc nhở đo huyết áp</Text>
              <Text style={styles.menuSubtitle}>Cập nhật lại thời gian nhắc nhở</Text>
            </View>
            <Switch
              value={isBpReminderActive}
              onValueChange={async (val) => {
                setIsBpReminderActive(val);
                if (val) {
                  setModalVisible(true); // Mở modal để nhập giờ và ghi chú
                } else {
                  // Tắt nhắc nhở
                  setLoading(true);
                  try {
                    const token = await AsyncStorage.getItem('token');
                    if (!token || !reminderId) {
                      setLoading(false);
                      return;
                    }
                    await updateBloodPressureReminder(reminderId, { isActive: false }, token);
                  } catch (err) {
                    alert('Có lỗi khi cập nhật trạng thái nhắc nhở!');
                  }
                  setLoading(false);
                }
              }}
              thumbColor={isBpReminderActive ? '#2563eb' : '#ccc'}
              trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
            />
          </View>
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Cài đặt nhắc nhở huyết áp</Text>
                <Text>Chọn giờ nhắc nhở:</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setTimePickerVisible(true)}
                >
                  <Text style={{ fontSize: 16 }}>{reminderTime}</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={isTimePickerVisible}
                  mode="time"
                  onConfirm={(date) => {
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    setReminderTime(`${hours}:${minutes}`);
                    setTimePickerVisible(false);
                  }}
                  onCancel={() => setTimePickerVisible(false)}
                />
                <Text style={{ marginTop: 10 }}>Ghi chú (không bắt buộc):</Text>
                <TextInput
                  style={styles.input}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Nhập ghi chú nếu muốn"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
                  <Button title="Hủy" color="#888" onPress={() => { setModalVisible(false); setIsBpReminderActive(false); }} />
                  <View style={{ width: 12 }} />
                  <Button
                    title={loading ? 'Đang lưu...' : 'Lưu'}
                    onPress={async () => {
                      const userId = await AsyncStorage.getItem('userId');
                      const data = {
                        userId: userId || '',
                        times: [{ time: reminderTime }],
                        note: note,
                        isActive: true,
                      };
                      setLoading(true);
                      try {
                        if (!token) {
                          alert('Không tìm thấy token, vui lòng đăng nhập lại!');
                          setLoading(false);
                          return;
                        }
                        let res;
                        if (reminderId) {
                          // Đã có reminder, cập nhật lại giờ và ghi chú
                          res = await updateBloodPressureReminder(reminderId, data, token);
                        } else {
                          // Chưa có, tạo mới
                          res = await createBloodPressureReminder(data, token);
                          setReminderId(res._id || null);
                        }
                        setModalVisible(false);
                      } catch (err: any) {
                        alert('Có lỗi xảy ra khi lưu nhắc nhở!');
                      }
                      setLoading(false);
                    }}
                    color="#2563eb"
                    disabled={loading}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>

        {/* TÀI KHOẢN */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TÀI KHOẢN</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuTitle}>Ngôn ngữ</Text>
            <Text style={styles.menuSubtitle}>Tiếng việt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuTitle}>Thông tin ứng dụng</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, {marginTop: 20}]}>
            <View>
              <Text style={[styles.menuTitle, {color: '#ef4444'}]}>Xóa tài khoản này</Text>
              <Text style={styles.menuSubtitle}>Xóa vĩnh viễn tài khoản và thông tin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  fontSizeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  fontSizeButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2563eb',
  },
  fontSizeValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginHorizontal: 12,
    minWidth: 45,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    letterSpacing: 0.2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
});

export default AppSettingsRelative;
