import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BPReminderService, { BloodPressureReminder } from '../api/BloodPressureReminder';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const EditBloodPressureScreen = ({ navigation, route }: any) => {
  const reminder: BloodPressureReminder | undefined = route?.params?.reminder;

  const [morningTime, setMorningTime] = useState('');
  const [eveningTime, setEveningTime] = useState('');
  const [note, setNote] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<'morning' | 'evening'>('morning');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reminder) return;
    setNote(reminder.note ?? '');
    if (Array.isArray(reminder.times)) {
      // Prefer labels if present
      const morning = reminder.times.find((t) => (t as any).label === 'Sáng') || reminder.times[0];
      const evening = reminder.times.find((t) => (t as any).label === 'Tối') || reminder.times[1];
      if (morning) setMorningTime(morning.time ?? '');
      if (evening) setEveningTime(evening.time ?? '');
    }
  }, [reminder]);

  const handleSave = async () => {
    if (!morningTime && !eveningTime) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ít nhất một thời gian nhắc.');
      return;
    }

    const times: { label?: string; time: string }[] = [];
    if (morningTime) times.push({ label: 'Sáng', time: morningTime });
    if (eveningTime) times.push({ label: 'Tối', time: eveningTime });

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !reminder?._id) {
        Alert.alert('Không xác thực', 'Thiếu token hoặc id nhắc.');
        setLoading(false);
        return;
      }

      const data = {
        times,
        note: note || undefined,
        isActive: true,
      };

      await BPReminderService.updateBloodPressureReminder(reminder._id, data, token);
      Alert.alert('Thành công', 'Đã cập nhật nhắc đo huyết áp.');
      navigation.goBack();
    } catch (err) {
      console.error('Update BP reminder error', err);
      Alert.alert('Lỗi', 'Có lỗi khi cập nhật nhắc đo huyết áp. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Chỉnh sửa lịch đo huyết áp</Text>

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
    borderRadius: 12,
    margin: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E6EEF9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 18, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 15, color: '#64748B', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#F0F6FF', borderRadius: 10, borderWidth: 1, borderColor: '#B6D5FA', padding: 12, fontSize: 16, color: '#1E293B' },
  timeInput: { backgroundColor: '#F0F6FF', borderRadius: 10, borderWidth: 1, borderColor: '#B6D5FA', padding: 12, height: 48, justifyContent: 'center' },
  timeText: { fontSize: 16, color: '#1E293B' },
  addButton: { backgroundColor: '#16A34A', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default EditBloodPressureScreen;
