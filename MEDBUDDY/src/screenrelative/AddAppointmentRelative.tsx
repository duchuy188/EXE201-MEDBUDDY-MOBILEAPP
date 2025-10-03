import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import AppointmentService from '../api/Appointments';

const AddAppointmentRelative = () => {
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
    } catch (error) {
      console.error('Error adding appointment:', error);
      Alert.alert(
        'Lỗi',
        'Không thể thêm lịch hẹn. Vui lòng thử lại sau.'
      );
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
});

export default AddAppointmentRelative;