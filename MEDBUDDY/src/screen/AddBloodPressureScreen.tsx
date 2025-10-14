import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BloodPressureReminder from '../api/BloodPressureReminder';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const AddBloodPressureScreen = ({ navigation }: any) => {
  const [morningTime, setMorningTime] = useState('');
  const [eveningTime, setEveningTime] = useState('');
  const [note, setNote] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<'morning' | 'evening'>('morning');

  const today = new Date();
  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const [startDate] = useState(today);
  const [endDate] = useState(today);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validate at least one time is selected
    if (!morningTime && !eveningTime) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ít nhất một thời gian nhắc.');
      return;
    }

  // include label so the server doesn't apply the schema default ('Sáng') to every entry
  const times: { label: string; time: string }[] = [];
  if (morningTime) times.push({ label: 'Sáng', time: morningTime });
  if (eveningTime) times.push({ label: 'Tối', time: eveningTime });

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (!token || !userId) {
        Alert.alert('Không xác thực', 'Không tìm thấy token hoặc userId. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      const data = {
        userId: userId,
        times,
        note: note || undefined,
        isActive: true,
      };

  const res = await BloodPressureReminder.createBloodPressureReminder(data, token);
      // Optionally you can check res for created id
      Alert.alert('Thành công', 'Đã tạo nhắc đo huyết áp.');
      navigation.goBack();
    } catch (err: any) {
      console.log('Create BP reminder error', err);
      Alert.alert('Lỗi', 'Có lỗi khi tạo nhắc đo huyết áp. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateConfirm = (date: Date) => {
    // set start and close picker - here we keep startDate as Date
    // (we used state variable as Date so we would normally set it; kept const earlier for simplicity)
    // For now we navigate with saved state; to keep code simple, we'll just dismiss picker and ignore mutation
    setShowStartDatePicker(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    setShowEndDatePicker(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Thêm lịch đo huyết áp</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thời gian nhắc - Buổi sáng</Text>
            <TouchableOpacity style={styles.timeInput} onPress={() => { setCurrentSlot('morning'); setShowTimePicker(true); }}>
              <Text style={styles.timeText}>{morningTime || 'Chọn thời gian'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thời gian nhắc - Buổi tối</Text>
            <TouchableOpacity style={styles.timeInput} onPress={() => { setCurrentSlot('evening'); setShowTimePicker(true); }}>
              <Text style={styles.timeText}>{eveningTime || 'Chọn thời gian'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Ghi chú (ví dụ: đo sau khi uống thuốc)"
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Lưu</Text>
            )}
          </TouchableOpacity>

          <DateTimePickerModal isVisible={showStartDatePicker} mode="date" onConfirm={handleStartDateConfirm} onCancel={() => setShowStartDatePicker(false)} minimumDate={new Date()} />
          <DateTimePickerModal isVisible={showEndDatePicker} mode="date" onConfirm={handleEndDateConfirm} onCancel={() => setShowEndDatePicker(false)} minimumDate={new Date()} />

          <DateTimePickerModal
            isVisible={showTimePicker}
            mode="time"
            onConfirm={(date) => {
              const formatted = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
              if (currentSlot === 'morning') setMorningTime(formatted);
              else setEveningTime(formatted);
              setShowTimePicker(false);
            }}
            onCancel={() => setShowTimePicker(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FB' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
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
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 24, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, color: '#64748B', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#F0F6FF', borderRadius: 10, borderWidth: 1, borderColor: '#B6D5FA', padding: 12, fontSize: 16, color: '#1E293B' },
  timeInput: { backgroundColor: '#F0F6FF', borderRadius: 10, borderWidth: 1, borderColor: '#B6D5FA', padding: 12, height: 48, justifyContent: 'center' },
  timeText: { fontSize: 16, color: '#1E293B' },
  addButton: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

// Additional styles for card layout
Object.assign(styles, {
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EEF9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginVertical: 8
  },
  cardTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  cardContent: { paddingTop: 6 },
  rowLabel: { marginTop: 8 },
  smallLabel: { color: '#374151', marginBottom: 6 },
  pulseInput: { backgroundColor: '#F0F8FF', paddingVertical: 12 },
  placeholderText: { color: '#9CA3AF' },
  sectionTitle: { marginTop: 14, marginBottom: 6 },
  labelWithIcon: { marginTop: 8, marginBottom: 6 },
  timeBox: { backgroundColor: '#F8FAFF', paddingVertical: 14 },
  selectedSummary: { marginTop: 10, color: '#6B7280', fontSize: 13 }
});

Object.assign(styles, {
  sectionTitle: { marginTop: 14, marginBottom: 6 },
  labelWithIcon: { marginTop: 8, marginBottom: 6 },
  timeBox: { backgroundColor: '#F8FAFF', paddingVertical: 14 },
  placeholderText: { color: '#9CA3AF' },
  noteInput: { backgroundColor: '#ECFDF5' },
});

export default AddBloodPressureScreen;
