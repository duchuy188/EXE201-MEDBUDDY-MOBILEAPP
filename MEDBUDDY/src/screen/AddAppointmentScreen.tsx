import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import AppointmentService from '../api/Appointments';

const AddAppointmentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token, userId } = route.params as { token: string; userId: string };
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [hospital, setHospital] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  
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

  const handleAddAppointment = async () => {
    if (!appointmentTitle || !hospital || !location || !selectedTime) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const appointmentData = {
        title: appointmentTitle,
        hospital,
        location,
        date: selectedDate.toISOString(),
        time: selectedTime,
        notes: note,
        userId: userId,
        status: 'pending' as 'pending'
      };

      const response = await AppointmentService.addAppointment(appointmentData, token);
      
      if (response) {
        Alert.alert(
          'Thành công',
          'Đã thêm lịch hẹn mới',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error: any) {
      const errObj = error?.response?.data || error?.response || error || {};
      console.error('Error adding appointment:', errObj);

      if (
        errObj?.error === 'FEATURE_ACCESS_DENIED' ||
        errObj?.message?.includes('không có quyền sử dụng') ||
        errObj?.requiredFeature === 'Đặt lịch khám' ||
        (error?.response?.status === 403)
      ) {
        // show upgrade modal instead of Alert
        setUpgradeMessage(errObj?.message || 'Vui lòng mua gói để sử dụng tính năng này.');
        setUpgradeModalVisible(true);
      } else {
        Alert.alert(
          'Lỗi',
          'Không thể thêm lịch hẹn. Vui lòng thử lại sau.'
        );
      }
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
      >
        <View style={styles.card}>
          <Text style={styles.title}>Thêm lịch hẹn khám bệnh</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiêu đề lịch hẹn</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tiêu đề lịch hẹn"
              value={appointmentTitle}
              onChangeText={setAppointmentTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bệnh viện</Text>
            <TextInput
              style={styles.input}
              placeholder="Chọn bệnh viện"
              value={hospital}
              onChangeText={setHospital}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa điểm</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa điểm"
              value={location}
              onChangeText={setLocation}
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
            />
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddAppointment}
          >
            <Text style={styles.buttonText}>Thêm lịch hẹn</Text>
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
          {/* Upgrade modal shown when server returns 403 asking to buy plan */}
          <Modal
            visible={upgradeModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setUpgradeModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.patientModal, { maxHeight: 240 }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Không thể tạo lịch hẹn</Text>
                  <TouchableOpacity onPress={() => setUpgradeModalVisible(false)}>
                    <MaterialIcons name="close" size={22} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View style={{ paddingTop: 8 }}>
                  <Text style={{ color: '#374151', fontSize: 15, lineHeight: 22 }}>
                    {upgradeMessage || 'Vui lòng mua gói để sử dụng tính năng này.'}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                    <TouchableOpacity
                      onPress={() => setUpgradeModalVisible(false)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 10 }}
                    >
                      <Text style={{ color: '#6B7280' }}>Đóng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setUpgradeModalVisible(false);
                        // Navigate to subscription/upgrade screen
                        // @ts-ignore
                        navigation.navigate('PackageScreen');
                      }}
                      style={{ backgroundColor: '#4A7BA7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Mua gói</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
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
  }
  ,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  patientModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  }
});

export default AddAppointmentScreen;