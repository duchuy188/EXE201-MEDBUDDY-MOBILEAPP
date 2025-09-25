import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ReminderService from '../api/Reminders';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';

interface ReminderData {
  userId: string;
  medicationId: string;
  time: string;
  timeOfDay?: string;
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

// Đường dẫn tương đối từ vị trí hiện tại (src/screen)
const voiceFiles: { [key: string]: any } = {
  banmai: require('../../voice/banmai.mp3'),
  thuminh: require('../../voice/thuminh.mp3'),
  giahuy: require('../../voice/giahuy.mp3'),
  lannhi: require('../../voice/lannhi.mp3'),
  leminh: require('../../voice/leminh.mp3'),
  myan: require('../../voice/myan.mp3'),
  linhsan: require('../../voice/linhsan.mp3'),
};

const AddReminderScreen = () => {
  const route = useRoute();
  const routeParams = route.params as { token?: string; userId?: string; medication?: any } || {};
  const { token: paramToken, userId, medication } = routeParams;

  const [token, setToken] = useState(paramToken || '');
  // Nếu có medication truyền vào thì lấy tên thuốc, không thì để trống
  const [medicationName, setMedicationName] = useState(medication?.name || '');

  // Lưu giờ cho từng mốc Sáng, Trưa, Tối
  const [selectedTimes, setSelectedTimes] = useState<{[key: string]: string}>(() => {
    if (medication?.timeOfDay) {
      const timeArr = (medication.timeOfDay || '').split(',').map((t: string) => t.trim());
      const newSelectedTimes: {[key: string]: string} = { Sáng: '', Trưa: '', Tối: '' };
      timeArr.forEach((t: string) => {
        if (t === 'morning') newSelectedTimes['Sáng'] = 'Chọn giờ';
        if (t === 'afternoon') newSelectedTimes['Trưa'] = 'Chọn giờ';
        if (t === 'evening') newSelectedTimes['Tối'] = 'Chọn giờ';
      });
      return newSelectedTimes;
    }
    return { Sáng: '', Trưa: '', Tối: '' };
  });

  React.useEffect(() => {
    // Nếu token truyền vào không có hoặc không hợp lệ, lấy lại từ AsyncStorage
    if (!token || token === 'undefined' || token === null) {
      (async () => {
        const storedToken = await (await import('@react-native-async-storage/async-storage')).default.getItem('token');
        if (storedToken) setToken(storedToken);
      })();
    }
  }, [token]);
  // Trả về mảng các mốc đã chọn (không rỗng)
  const getSelectedTimeOfDay = () => {
    return Object.entries(selectedTimes)
      .filter(([_, value]) => value)
      .map(([key]) => {
        if (key === 'Sáng') return 'morning';
        if (key === 'Trưa') return 'afternoon';
        if (key === 'Tối') return 'evening';
        return key;
      })
      .join(',');
  };
  const [activeTimeLabel, setActiveTimeLabel] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [reminderType, setReminderType] = useState<'normal' | 'voice'>('normal');
  const [voiceType, setVoiceType] = useState('banmai');
  const [speed, setSpeed] = useState<-3 | -2 | -1 | 0 | 1 | 2 | 3>(0);
  const [time, setTime] = useState(new Date());

  const reminderTypeOptions = [
    { label: 'Thông thường', value: 'normal' },
    { label: 'Giọng nói', value: 'voice' },
  ];

  const voiceOptions = [
    { label: 'Ban Mai (Nữ miền Bắc)', value: 'banmai' },
    { label: 'Thu Minh (Nữ miền Bắc)', value: 'thuminh' },
    { label: 'Lê Minh (Nam miền Bắc)', value: 'leminh' },
    { label: 'Gia Huy (Nam miền Trung)', value: 'giahuy' },
    { label: 'Mỹ An (Nữ miền Trung)', value: 'myan' },
    { label: 'Lan Nhi (Nữ miền Nam)', value: 'lannhi' },
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

  const handleTimeConfirm = (date: Date) => {
  if (activeTimeLabel) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    setSelectedTimes({
      ...selectedTimes,
      [activeTimeLabel]: `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`
    });
    setActiveTimeLabel(null);
    setShowTimePicker(false);
  }
  };

  const handleAddReminder = async () => {
    if (!medicationName || Object.values(selectedTimes).every(v => !v)) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên thuốc và chọn ít nhất một thời gian nhắc nhở');
      return;
    }

    if (repeatType === 'custom' && selectedDays.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một ngày trong tuần');
      return;
    }

    try {
      // Map các ngày sang số (0=CN, 1=T2, ... 6=T7)
      const weekDayMap: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
      const repeatDays = repeatType === 'custom' ? selectedDays.map(d => weekDayMap[d]) : undefined;

      // Lấy medicationId từ medication nếu có
      const medicationId = medication?._id || '';

      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }

      const reminderData: ReminderData = {
        userId,
        medicationId,
        time: Object.entries(selectedTimes)
          .filter(([label, time]) => time)
          .map(([label, time]) => `${label} ${time}`)
          .join(','),
        timeOfDay: getSelectedTimeOfDay(),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reminderType: reminderType,
        repeat: repeatType,
        repeatDays,
        note,
        ...(reminderType === 'voice' && {
          voice: voiceType as 'banmai' | 'thuminh' | 'giahuy' | 'lannhi' | 'leminh' | 'myan' | 'linhsan',
          speed: speed
        }),
        isActive: true,
      };

      await ReminderService.addReminder(reminderData, token);
      Alert.alert('Thành công', 'Đã thêm lịch nhắc uống thuốc');
      // Reset form
  setSelectedTimes({ Sáng: '', Trưa: '', Tối: '' });
      setNote('');
      if (repeatType === 'custom') {
        setSelectedDays([]);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể thêm lịch nhắc');
    }
  };

  const handleDateConfirm = (date: Date) => {
  // Không dùng nữa
  };

  const playVoiceTest = async () => {
    try {
      console.log('Starting to play voice for type:', voiceType);
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const soundObject = new Audio.Sound();
      
      // Load sound file
      console.log('Loading sound file...');
      const soundFile = voiceFiles[voiceType as keyof typeof voiceFiles];
      console.log('Sound file:', soundFile);
      await soundObject.loadAsync(soundFile, { shouldPlay: true });
      console.log('Sound loaded successfully');

      // Play sound
      console.log('Starting playback...');
      await soundObject.playAsync();
      console.log('Playback started');

      // Set volume to maximum
      await soundObject.setVolumeAsync(1.0);

      // Unload sound when finished
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Thêm lịch nhắc uống thuốc</Text>

        {/* Tên thuốc */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên thuốc</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên thuốc"
              value={medicationName}
              editable={false}
            />
        </View>

        {/* Ngày bắt đầu */}
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

        {/* Ngày kết thúc */}
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

        {/* Thời gian nhắc: mỗi mốc một dòng riêng biệt */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thời gian nhắc:</Text>
          {Object.entries(selectedTimes).filter(([_, value]) => value).length === 0 ? (
            <Text style={{ color: '#64748B', fontStyle: 'italic', marginBottom: 12 }}>
              Vui lòng chọn ít nhất một khung giờ nhắc!
            </Text>
          ) : (
            Object.entries(selectedTimes)
              .filter(([_, value]) => value)
              .map(([label]) => (
                <View key={label} style={{ marginBottom: 12 }}>
                  <Text style={styles.timeLabel}>{label}</Text>
                  <TouchableOpacity
                    style={styles.singleTimeInput}
                    onPress={() => {
                      setActiveTimeLabel(label);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeText}>
                      {selectedTimes[label] ? selectedTimes[label] : `Chọn buổi ${label.toLowerCase()}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
          )}
        </View>
        {/* DateTimePickerModal cho chọn giờ từng mốc */}
        <DateTimePickerModal
          isVisible={showTimePicker}
          mode="time"
          locale="vi"
          onConfirm={handleTimeConfirm}
          onCancel={() => {
            setShowTimePicker(false);
            setActiveTimeLabel(null);
          }}
        />


        {/* Loại nhắc nhở */}
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

        {/* Voice settings khi chọn voice */}
        {reminderType === 'voice' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giọng đọc</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={voiceType}
                  onValueChange={(itemValue) => setVoiceType(itemValue)}
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
                <Text style={styles.testVoiceText}>Nghe thử giọng đọc</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tốc độ đọc</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={speed}
                  onValueChange={(itemValue) => setSpeed(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#1E293B"
                >
                  {speedOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      color="#1E293B"
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </>
        )}

        {/* Lời nhắc */}
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
          style={[
            styles.addButton,
            !selectedTimes.Sáng && !selectedTimes.Trưa && !selectedTimes.Tối && styles.disabledButton
          ]}
          onPress={handleAddReminder}
          disabled={!selectedTimes.Sáng && !selectedTimes.Trưa && !selectedTimes.Tối}
        >
          <Text style={styles.buttonText}>Thêm lịch nhắc</Text>
        </TouchableOpacity>

  {/* Không dùng DateTimePickerModal cho thời gian nhắc nữa */}
        <DateTimePickerModal
          isVisible={showStartDatePicker}
          mode="date"
          onConfirm={(date) => {
            setStartDate(date);
            setShowStartDatePicker(false);
          }}
          onCancel={() => setShowStartDatePicker(false)}
          minimumDate={new Date()}
        />
        <DateTimePickerModal
          isVisible={showEndDatePicker}
          mode="date"
          onConfirm={(date) => {
            setEndDate(date);
            setShowEndDatePicker(false);
          }}
          onCancel={() => setShowEndDatePicker(false)}
          minimumDate={startDate}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  timeLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 2,
  },
  singleTimeInput: {
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    padding: 12,
    height: 48,
    justifyContent: 'center',
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },
  timeCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  timeButton: {
    backgroundColor: '#F0F6FF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#B6D5FA',
    paddingVertical: 10,
    paddingHorizontal: 0,
    minWidth: 80,
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  timeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    shadowOpacity: 0.15,
  },
  timeButtonText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  timeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#B6D5FA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 2,
    minWidth: 90,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
  timeCardText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
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
});

export default AddReminderScreen;
