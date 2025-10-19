import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import RelativePatientService from '../api/RelativePatient';
import NotificationService, { SendNotificationRequest } from '../api/Notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';

interface ReminderData {
  userId: string;
  medicationId: string;
  time: string;
  startDate: string;
  endDate: string;
  reminderType: 'normal' | 'voice';
  repeat: 'daily' | 'weekly' | 'custom';
  repeatDays?: number[];
  note: string;
  voice?: 'banmai' | 'thuminh' | 'giahuy' | 'lannhi' | 'leminh' | 'myan' | 'linhsan';
  speed?: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  isActive: boolean;
}

interface Patient {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface PatientRelationship {
  _id: string;
  patient: {
    _id: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  relationship: string;
  canViewMedications: boolean;
  canManageReminders: boolean;
}

const voiceFiles: { [key: string]: any } = {
  banmai: require('../../voice/banmai.mp3'),
  thuminh: require('../../voice/thuminh.mp3'),
  giahuy: require('../../voice/giahuy.mp3'),
  lannhi: require('../../voice/lannhi.mp3'),
  leminh: require('../../voice/leminh.mp3'),
  myan: require('../../voice/myan.mp3'),
  linhsan: require('../../voice/linhsan.mp3'),
};

const AddReminderRelative = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const routeParams = route.params as { 
    token?: string; 
    userId?: string; 
    medication?: any; 
    deviceToken?: string;
    selectedPatient?: Patient;
  } || {};
  const { token: paramToken, userId, medication, deviceToken, selectedPatient: paramSelectedPatient } = routeParams;

  const [token, setToken] = useState(paramToken || '');
  const [medicationName, setMedicationName] = useState(medication?.name || '');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(paramSelectedPatient || null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!token || token === 'undefined' || token === null) {
      (async () => {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) setToken(storedToken);
      })();
    }
  }, [token]);

  // Fetch patients when component mounts
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const currentToken = token || await AsyncStorage.getItem('token');
        if (currentToken) {
          const response = await RelativePatientService.getPatientsOfRelative(currentToken);
          console.log('Patients response:', response);
          
          if (response?.data) {
            const transformedPatients = response.data.map((relationship: PatientRelationship) => ({
              _id: relationship.patient._id,
              fullName: relationship.patient.fullName,
              email: relationship.patient.email,
              phone: relationship.patient.phone,
            }));
            setPatients(transformedPatients);
          }
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, [token]);

  const [selectedTimes, setSelectedTimes] = useState<{morning?: string, afternoon?: string, evening?: string}>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [reminderType, setReminderType] = useState<'normal' | 'voice'>('normal');
  const [voiceType, setVoiceType] = useState('banmai');
  const [speed, setSpeed] = useState<-3 | -2 | -1 | 0 | 1 | 2 | 3>(0);
  const [time, setTime] = useState(new Date());

  const handleVoiceChange = (itemValue: string) => {
    setVoiceType(itemValue);
  };

  const reminderTypeOptions = [
    { label: 'Thông thường', value: 'normal' },
    { label: 'Giọng nói', value: 'voice' },
  ];

  const voiceOptions = [
    { label: 'Ban Mai (Nữ miền Bắc)', value: 'banmai' },
    { label: 'Thu Minh (Nữ miền Bắc)', value: 'thuminh' },
    { label: 'Gia Huy (Nam miền Trung)', value: 'giahuy' },
    { label: 'Lan Nhi (Nữ miền Nam)', value: 'lannhi' },
    { label: 'Lê Minh (Nam miền Bắc)', value: 'leminh' },
    { label: 'Mỹ An (Nữ miền Trung)', value: 'myan' },
    { label: 'Linh San (Nữ miền Nam)', value: 'linhsan' },
  ];

  const speedOptions: Array<{label: string, value: -3 | -2 | -1 | 0 | 1 | 2 | 3}> = [
    { label: 'Chậm', value: -1 },
    { label: 'Thường', value: 0 },
    { label: 'Nhanh', value: 1 },
  ];

  const repeatOptions = [
    { label: 'Hàng ngày', value: 'daily' },
    { label: 'Hàng tuần', value: 'weekly' },
    { label: 'Tùy chỉnh', value: 'custom' },
  ];

  const weekDays = [
    { label: 'T2', value: 'MON' },
    { label: 'T3', value: 'TUE' },
    { label: 'T4', value: 'WED' },
    { label: 'T5', value: 'THU' },
    { label: 'T6', value: 'FRI' },
    { label: 'T7', value: 'SAT' },
    { label: 'CN', value: 'SUN' },
  ];

  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Hàm lấy giờ mặc định theo buổi
  const getDefaultTimeForSlot = (slot: 'morning' | 'afternoon' | 'evening'): Date => {
    const now = new Date();
    if (slot === 'morning') {
      now.setHours(7, 0, 0, 0); // 7:00 sáng
    } else if (slot === 'afternoon') {
      now.setHours(13, 0, 0, 0); // 13:00 chiều
    } else if (slot === 'evening') {
      now.setHours(19, 0, 0, 0); // 19:00 tối
    }
    return now;
  };

  const handleTimeConfirm = (date: Date) => {
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    setSelectedTimes(prev => ({...prev, [currentTimeSlot]: formattedTime}));
    setShowTimePicker(false);
  };

  const handleAddReminder = async () => {
    if (!selectedPatient) {
      Alert.alert('Thông báo', 'Vui lòng chọn người bệnh');
      return;
    }

    if (!medicationName || Object.keys(selectedTimes).length === 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên thuốc và chọn ít nhất một thời gian nhắc nhở');
      return;
    }

    if (repeatType === 'custom' && selectedDays.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một ngày trong tuần');
      return;
    }

    try {
      const weekDayMap: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
      const repeatDaysArray = repeatType === 'custom' ? selectedDays.map(d => weekDayMap[d]) : [];
      const medicationId = medication?._id || '';

      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }

      // Map selectedTimes sang định dạng backend yêu cầu
      const times = Object.entries(selectedTimes).map(([slot, _]) => ({
        time: slot === 'morning' ? 'Sáng' : slot === 'afternoon' ? 'Chiều' : 'Tối'
      }));

      const repeatTimes = Object.entries(selectedTimes).map(([_, timeValue]) => ({
        time: timeValue,
        taken: false
      }));

      const reminderData: any = {
        medicationId,
        times,
        startDate: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
        endDate: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`,
        reminderType: reminderType,
        repeatDays: repeatDaysArray,
        repeatTimes,
        note: note || 'Đã đến giờ uống thuốc rồi',
      };

      // Chỉ thêm voice nếu reminderType là 'voice'
      if (reminderType === 'voice') {
        reminderData.voice = voiceType as 'banmai' | 'thuminh' | 'giahuy' | 'lannhi' | 'leminh' | 'myan' | 'linhsan';
      }

      console.log('Date debugging:');
      console.log('startDate object:', startDate);
      console.log('endDate object:', endDate);
      console.log('startDate formatted:', `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`);
      console.log('endDate formatted:', `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`);
      console.log('Sending reminder data:', JSON.stringify(reminderData, null, 2));

      const currentToken = token || await AsyncStorage.getItem('token');
      if (!currentToken) {
        Alert.alert('Lỗi', 'Không tìm thấy token');
        return;
      }

      await RelativePatientService.createMedicationReminderForPatient(selectedPatient._id, reminderData, currentToken);

      if (reminderType === 'voice' && userId && currentToken && deviceToken) {
        const notificationData: any = {
          userId,
          title: 'Nhắc uống thuốc',
          body: 'Đã đến giờ uống thuốc!',
          sound: voiceType ? `${voiceType}.mp3` : undefined,
          token: deviceToken,
        };
        try {
          await NotificationService.sendNotification(notificationData, currentToken);
        } catch (error) {
          console.error('Gửi thông báo thất bại:', error);
        }
      }

      Alert.alert(
        'Thành công', 
        `Đã thêm lịch nhắc uống thuốc cho người bệnh ${selectedPatient.fullName}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedTimes({});
              setNote('');
              setSelectedPatient(null);
              if (repeatType === 'custom') {
                setSelectedDays([]);
              }

              // Explicitly navigate to the MedicationSchedule (RemindersRelative) screen
              // so the reminders list is shown and refreshed.
              // Passing selectedPatient can help the target screen if it reads params.
              // @ts-ignore
              navigation.navigate('MedicationSchedule', { selectedPatient });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error adding reminder:', error);
      const msg = error?.response?.data?.message || error?.message || 'Không thể thêm lịch nhắc';
      console.error('Error adding reminder (message):', msg);
      // If server returns 403 or message indicates missing package, show upgrade modal
      const status = error?.response?.status;
      if (status === 403 || /chưa có gói|mua gói|vui lòng mua gói/i.test(String(msg))) {
        setUpgradeMessage(msg);
        setUpgradeModalVisible(true);
      } else {
        Alert.alert('Lỗi', msg);
      }
    }
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const playVoiceTest = async () => {
    try {
      console.log('Starting to play voice for type:', voiceType);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const soundObject = new Audio.Sound();
      
      console.log('Loading sound file...');
      const soundFile = voiceFiles[voiceType as keyof typeof voiceFiles];
      console.log('Sound file:', soundFile);
      await soundObject.loadAsync(soundFile, { shouldPlay: true });
      console.log('Sound loaded successfully');

      console.log('Starting playback...');
      await soundObject.playAsync();
      console.log('Playback started');

      await soundObject.setVolumeAsync(1.0);

      soundObject.setOnPlaybackStatusUpdate(async (status) => {
        console.log('Playback status:', status);
        if (!status.isLoaded) return;
        if (status.isPlaying === false && status.positionMillis === status.durationMillis) {
          console.log('Playback finished, unloading sound');
          await soundObject.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Lỗi', 'Không thể phát âm thanh: ' + (error as Error).message);
    }
  };

  const timeSlots = [
    { key: 'morning', label: '🌅 Buổi sáng' },
    { key: 'afternoon', label: '🌤️ Buổi chiều' },
    { key: 'evening', label: '🌙 Buổi tối' },
  ];

  // CẬP NHẬT: Lấy allowedSlots từ medication.times thay vì medication.timeOfDay
  const allowedSlots = medication?.times 
    ? medication.times.map((t: any) => {
        // Chuyển "Sáng", "Chiều", "Tối" sang "morning", "afternoon", "evening"
        const timeMap: { [key: string]: string } = {
          'Sáng': 'morning',
          'Chiều': 'afternoon', 
          'Tối': 'evening'
        };
        return timeMap[t.time] || t.time.toLowerCase();
      })
    : ['morning', 'afternoon', 'evening']; // fallback: hiển thị tất cả nếu không có data

  console.log('Medication:', medication);
  console.log('Medication times:', medication?.times);
  console.log('Allowed slots:', allowedSlots);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    setShowStartDatePicker(false);
  };
  const handleEndDateConfirm = (date: Date) => {
    setEndDate(date);
    setShowEndDatePicker(false);
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
          <Text style={styles.title}>Thêm lịch nhắc uống thuốc</Text>

          {/* Chỉ hiển thị chọn người bệnh nếu chưa có selectedPatient từ params */}
          {!paramSelectedPatient && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chọn người bệnh</Text>
              <TouchableOpacity 
                style={[styles.input, { minHeight: 48, justifyContent: 'center' }]}
                onPress={() => setShowPatientModal(true)}
              >
                <View style={styles.patientSelector}>
                  <Text style={[styles.patientSelectorText, !selectedPatient && styles.placeholderText]}>
                    {selectedPatient ? selectedPatient.fullName : 'Chọn người bệnh'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Hiển thị thông tin người bệnh đã chọn nếu có từ params */}
          {paramSelectedPatient && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Người bệnh</Text>
              <View style={[styles.input, { minHeight: 48, justifyContent: 'center', backgroundColor: '#F8FAFC' }]}>
                <Text style={{ fontSize: 16, color: '#1E293B', fontWeight: '600' }}>
                  {selectedPatient?.fullName}
                </Text>
                {selectedPatient?.email && (
                  <Text style={{ fontSize: 14, color: '#64748B', marginTop: 2 }}>
                    📧 {selectedPatient.email}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên thuốc</Text>
            <View style={[styles.input, { minHeight: 48, justifyContent: 'center' }]}>
              <Text style={{ fontSize: 16, color: '#1E293B' }}>{medicationName}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày bắt đầu</Text>
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.timeText}>
                {startDate.toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày kết thúc</Text>
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.timeText}>
                {endDate.toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thời gian nhắc</Text>
            {timeSlots
              .filter(slot => allowedSlots.includes(slot.key))
              .map(slot => (
                <View style={styles.timeSlotContainer} key={slot.key}>
                  <Text style={styles.timeSlotLabel}>{slot.label}</Text>
                  <View style={styles.timeRow}>
                    <TouchableOpacity
                      style={styles.timeInputFlex}
                      onPress={() => {
                        setCurrentTimeSlot(slot.key as 'morning' | 'afternoon' | 'evening');
                        // Nếu đã chọn giờ rồi thì dùng giờ đã chọn, không thì dùng giờ mặc định
                        const existingTime = selectedTimes[slot.key as 'morning' | 'afternoon' | 'evening'];
                        if (existingTime) {
                          // Parse giờ đã chọn
                          const [hours, minutes] = existingTime.split(':');
                          const date = new Date();
                          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          setTime(date);
                        } else {
                          // Dùng giờ mặc định cho slot
                          setTime(getDefaultTimeForSlot(slot.key as 'morning' | 'afternoon' | 'evening'));
                        }
                        setShowTimePicker(true);
                      }}
                    >
                      <Text style={styles.timeText}>
                        {selectedTimes[slot.key as 'morning' | 'afternoon' | 'evening']
                          ? selectedTimes[slot.key as 'morning' | 'afternoon' | 'evening']
                          : 'Chọn thời gian'}
                      </Text>
                    </TouchableOpacity>
                    {selectedTimes[slot.key as 'morning' | 'afternoon' | 'evening'] && (
                      <TouchableOpacity
                        style={styles.clearTimeButton}
                        onPress={() => setSelectedTimes(prev => {
                          const newTimes = { ...prev };
                          delete newTimes[slot.key as 'morning' | 'afternoon' | 'evening'];
                          return newTimes;
                        })}
                      >
                        <Text style={styles.clearTimeText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            {/* Hiển thị tổng hợp thời gian đã chọn */}
            <Text style={{marginTop: 8, color: '#475569', fontSize: 15}}>
              Đã chọn: {
                Object.values(selectedTimes).length > 0
                  ? Object.entries(selectedTimes)
                      .map(([slot, time]) => {
                        const slotLabel = slot === 'morning' ? 'Sáng' : slot === 'afternoon' ? 'Chiều' : 'Tối';
                        return `${slotLabel}: ${time}`;
                      })
                      .join(', ')
                  : 'Chưa chọn thời gian'
              }
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loại nhắc nhở</Text>
            <View style={styles.repeatContainer}>
              {reminderTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.repeatOption,
                    reminderType === option.value && styles.selectedRepeatOption
                  ]}
                  onPress={() => setReminderType(option.value as 'normal' | 'voice')}
                >
                  <Text style={[
                    styles.repeatOptionText,
                    reminderType === option.value && styles.selectedRepeatOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {reminderType === 'voice' && (
            <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Giọng đọc</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={voiceType}
                      onValueChange={handleVoiceChange}
                      style={styles.picker}
                      dropdownIconColor="#1E293B"
                    >
                      {voiceOptions.map((option) => (
                        <Picker.Item 
                          key={option.value} 
                          label={option.label} 
                          value={option.value}
                          color="#1E293B"
                        />
                      ))}
                    </Picker>
                  </View>
                  <TouchableOpacity
                    style={styles.testVoiceButton}
                    onPress={playVoiceTest}
                  >
                    <Text style={styles.testVoiceText}>🔊 Nghe thử giọng đọc</Text>
                  </TouchableOpacity>
                </View>            
                <View style={styles.inputGroup}>
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lời nhắc (không bắt buộc)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập lời nhắc"
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, (!selectedPatient || Object.keys(selectedTimes).length === 0) && styles.disabledButton]}
            onPress={handleAddReminder}
            disabled={!selectedPatient || Object.keys(selectedTimes).length === 0}
          >
            <Text style={styles.buttonText}>
              {!selectedPatient 
                ? 'Chọn người bệnh để thêm lịch nhắc'
                : Object.keys(selectedTimes).length > 0 
                  ? `Thêm ${Object.keys(selectedTimes).length} lịch nhắc cho ${selectedPatient.fullName}` 
                  : 'Thêm lịch nhắc'}
            </Text>
          </TouchableOpacity>

          {/* Patient Selection Modal */}
          <Modal
            visible={showPatientModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPatientModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn người bệnh</Text>
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
                          <Text style={styles.patientDetail}>📧 {item.email}</Text>
                        )}
                        {item.phone && (
                          <Text style={styles.patientDetail}>📱 {item.phone}</Text>
                        )}
                      </View>
                      {selectedPatient?._id === item._id && (
                        <MaterialIcons name="check-circle" size={24} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyList}>
                      <Text style={styles.emptyText}>Không có người bệnh nào</Text>
                    </View>
                  }
                />
              </View>
            </View>
          </Modal>

          {/* Upgrade modal shown when server returns 403 asking to buy plan (NEW) */}
          <Modal
            visible={upgradeModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setUpgradeModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.patientModal, { maxHeight: 240 }] }>
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

          <DateTimePickerModal
            isVisible={showTimePicker}
            mode="time"
            onConfirm={handleTimeConfirm}
            onCancel={() => setShowTimePicker(false)}
            date={time}
          />
          <DateTimePickerModal
            isVisible={showStartDatePicker}
            mode="date"
            onConfirm={handleStartDateConfirm}
            onCancel={() => setShowStartDatePicker(false)}
            minimumDate={new Date()}
          />
          <DateTimePickerModal
            isVisible={showEndDatePicker}
            mode="date"
            onConfirm={handleEndDateConfirm}
            onCancel={() => setShowEndDatePicker(false)}
            minimumDate={startDate}
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
  testVoiceButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  testVoiceText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: '#F0F6FF',
    color: '#1E293B',
    height: 50,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  dayOption: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    width: 40,
    height: 40,
    marginHorizontal: 2,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDayOption: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dayOptionText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  selectedDayOptionText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  repeatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  repeatOption: {
    flex: 1,
    backgroundColor: '#F0F6FF',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  selectedRepeatOption: {
    backgroundColor: '#B6D5FA',
    borderColor: '#3B82F6',
  },
  repeatOptionText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedRepeatOptionText: {
    color: '#1E293B',
    fontWeight: 'bold',
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
    minHeight: 100,
    textAlignVertical: 'top',
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
  timeSlotContainer: {
    marginBottom: 16,
  },
  timeSlotLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInputFlex: {
    flex: 1,
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    padding: 12,
    height: 48,
    justifyContent: 'center',
  },
  clearTimeButton: {
    width: 36,
    height: 36,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearTimeText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
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
  disabledButton: {
    backgroundColor: '#B6D5FA',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientSelectorText: {
    fontSize: 16,
    color: '#1E293B',
  },
  placeholderText: {
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  patientModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
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
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
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
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default AddReminderRelative;