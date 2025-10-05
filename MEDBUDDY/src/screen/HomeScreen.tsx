import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, FontAwesome, Feather } from '@expo/vector-icons';
import bloodPressureService, { BloodPressure } from '../api/bloodPressure';
import RelativePatientService from '../api/RelativePatient';
import ReminderService from '../api/Reminders';
import { useRoute } from '@react-navigation/native';

interface HomeScreenProps {
  userType?: 'patient' | 'family';
  onLogout?: () => void;
}

interface DetailedReminder {
  _id: string;
  userId: string;
  medicationId?: {
    _id: string;
    name?: string;
    dosage?: string;
    quantity?: string; // Thêm quantity
    form?: string;
  };
  times: { time: string; _id?: string }[];
  startDate: string;
  endDate: string;
  reminderType: 'normal' | 'voice';
  repeatTimes?: { 
    time: string; 
    taken?: boolean; 
    _id?: string;
    status?: 'pending' | 'on_time' | 'late' | 'missed' | 'skipped' | 'snoozed'; // Thêm status
  }[];
  note?: string;
  voice?: string;
  isActive?: boolean;
  createdAt?: string;
  status?: 'pending' | 'completed' | 'snoozed';
}

interface FlattenedReminder {
  _id: string;
  time: string;
  timeLabel: string;
  medicationName: string;
  dosage: string;
  note?: string;
  taken?: boolean;
  status?: 'pending' | 'on_time' | 'late' | 'missed' | 'skipped' | 'snoozed';
}

const HomeScreen: React.FC<HomeScreenProps> = ({ userType = 'patient', onLogout }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bpHistory, setBpHistory] = useState<BloodPressure[]>([]);
  const [relatives, setRelatives] = useState<any[]>([]);
  const [loadingRelatives, setLoadingRelatives] = useState(false);
  const [reminders, setReminders] = useState<DetailedReminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const route = useRoute();
  
  const token = route.params?.token || '';
  const userId = route.params?.userId || '';

  // Debug log
  React.useEffect(() => {
    console.log('HomeScreen params:', route.params);
    console.log('HomeScreen token:', token);
    console.log('HomeScreen userId:', userId);
  }, [route.params, token, userId]);

  // Lấy dữ liệu khi vào màn hình
  useEffect(() => {
    if (!token) return;
    fetchBpHistory();
    fetchRelatives();
    fetchReminders();
  }, [token]);

  const fetchBpHistory = async () => {
    setLoading(true);
    try {
      const data = await bloodPressureService.getBloodPressureHistory(token);
      setBpHistory(data || []);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu huyết áp');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatives = async () => {
    if (!token) return;
    setLoadingRelatives(true);
    try {
      const data = await RelativePatientService.getRelativesOfPatient(token);
      setRelatives(data || []);
    } catch (e) {
      console.error('Lỗi khi lấy danh sách người thân:', e);
    } finally {
      setLoadingRelatives(false);
    }
  };

  // Lấy danh sách lịch uống thuốc hôm nay với status
  const fetchReminders = async () => {
    if (!token) return;
    setLoadingReminders(true);
    try {
      const remindersData = await ReminderService.getReminders(token);
      console.log('Raw reminders data:', remindersData);
      
      const detailedReminders = await Promise.all(
        remindersData.map(async (reminder: any) => {
          const detailData = await ReminderService.getReminderById(reminder._id, token);
          console.log('Detail data for reminder', reminder._id, ':', detailData);
          
          // Lấy thêm status details từ API mới
          try {
            const statusResponse = await ReminderService.getReminderStatus(reminder._id, token);
            console.log('Status response for reminder', reminder._id, ':', statusResponse);
            
            // Kiểm tra structure của response
            if (statusResponse && statusResponse.statusDetails) {
              const statusDetails = statusResponse.statusDetails;
              console.log('Status details:', statusDetails);
              
              if (detailData.repeatTimes && Array.isArray(detailData.repeatTimes)) {
                detailData.repeatTimes = detailData.repeatTimes.map((rt: any) => {
                  // Tìm statusDetail khớp với time
                  const statusDetail = statusDetails.find((sd: any) => sd.time === rt.time);
                  console.log(`Matching time ${rt.time}:`, statusDetail);
                  
                  if (statusDetail) {
                    return {
                      ...rt,
                      taken: statusDetail.taken,
                      status: statusDetail.status,
                      takenAt: statusDetail.takenAt,
                    };
                  }
                  return rt;
                });
                
                console.log('Updated repeatTimes:', detailData.repeatTimes);
              }
            }
          } catch (statusError) {
            console.error('Error fetching status for reminder', reminder._id, ':', statusError);
          }
          
          return detailData;
        })
      );
      
      console.log('Final detailed reminders:', detailedReminders);
      setReminders(detailedReminders);
    } catch (e) {
      console.error('Lỗi khi lấy lịch uống thuốc:', e);
    } finally {
      setLoadingReminders(false);
    }
  };

  // Flatten reminders - GIỐNG MedicationScheduleScreen
  const flattenReminders = (reminders: DetailedReminder[]): FlattenedReminder[] => {
    const flattened: FlattenedReminder[] = [];
    
    reminders.forEach(reminder => {
      if (reminder.repeatTimes && reminder.repeatTimes.length > 0) {
        reminder.repeatTimes.forEach((repeatTime, index) => {
          const timeLabel = reminder.times[index]?.time || 'Không xác định';
          
          // Lấy dosage từ form thay vì quantity
          let dosage = '';
          if (reminder.medicationId?.form) {
            dosage = reminder.medicationId.form;
          }
          
          flattened.push({
            _id: `${reminder._id}-${index}`,
            time: repeatTime.time || 'Chưa đặt giờ',
            timeLabel: timeLabel,
            medicationName: reminder.medicationId?.name || 'Thuốc',
            dosage: dosage,
            note: reminder.note,
            taken: repeatTime.taken,
            status: repeatTime.status // Thêm status từ repeatTime
          });
        });
      }
    });
    
    return flattened;
  };

  // Lấy reminders cho hôm nay
  const getTodayReminders = (): FlattenedReminder[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const flattenedReminders = flattenReminders(reminders);
    
    return flattenedReminders.filter(reminder => {
      // Tìm reminder gốc để check startDate/endDate
      const originalReminder = reminders.find(r => reminder._id.startsWith(r._id));
      if (!originalReminder) return false;
      
      const startDate = new Date(originalReminder.startDate);
      const endDate = new Date(originalReminder.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return today >= startDate && today <= endDate && originalReminder.isActive !== false;
    });
  };

  // Đánh dấu đã uống thuốc
  const handleMarkAsTaken = async (reminderId: string, time: string) => {
    try {
      const originalId = reminderId.split('-')[0];
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);
      
      // Xác định trạng thái dựa trên thời gian
      let status: 'on_time' | 'late' = 'on_time';
      const timeDiff = now.getTime() - reminderTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff > 30) { // Nếu uống muộn hơn 30 phút
        status = 'late';
      }

      console.log('Updating reminder status:', {
        reminderId: originalId,
        payload: {
          action: 'take',
          time: time,
          status: status,
        }
      });

      const result = await ReminderService.updateReminderStatus(originalId, {
        action: 'take',
        time: time,
        status: status,
      }, token);

      console.log('Update result:', result);
      
      Alert.alert(
        'Thành công', 
        status === 'on_time' 
          ? 'Đã đánh dấu đã uống thuốc đúng giờ' 
          : 'Đã đánh dấu đã uống thuốc (muộn)'
      );
      
      // Refresh ngay lập tức
      await fetchReminders();
    } catch (e) {
      console.error('Error updating reminder status:', e);
      Alert.alert('Lỗi', `Không thể cập nhật trạng thái uống thuốc: ${e.message || e}`);
    }
  };

  // Bỏ qua lần uống thuốc
  const handleSkipMedication = async (reminderId: string, time: string) => {
    try {
      const originalId = reminderId.split('-')[0];
      await ReminderService.updateReminderStatus(originalId, {
        action: 'skip',
        time: time,
        status: 'skipped',
      }, token);
      Alert.alert('Đã bỏ qua', 'Đã đánh dấu bỏ qua lần uống thuốc này');
      fetchReminders();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  // Hoãn lịch uống thuốc
  const handleSnoozeMedication = async (reminderId: string, time: string) => {
    try {
      const originalId = reminderId.split('-')[0];
      await ReminderService.updateReminderStatus(originalId, {
        action: 'snooze',
        time: time,
        status: 'snoozed',
      }, token);
      Alert.alert('Đã hoãn', 'Sẽ nhắc lại sau 10 phút');
      fetchReminders();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể hoãn lịch nhắc');
    }
  };

  // Sửa lại hàm getStatusDisplay để debug
  const getStatusDisplay = (status?: string, taken?: boolean) => {
    console.log('getStatusDisplay - status:', status, 'taken:', taken);
    
    if (status === 'on_time' || status === 'late') {
      if (status === 'on_time') {
        return { color: '#12B76A', icon: '✓', text: 'Đã uống đúng giờ' };
      }
      if (status === 'late') {
        return { color: '#F79009', icon: '⏰', text: 'Đã uống muộn' };
      }
    }
    
    if (taken) {
      return { color: '#12B76A', icon: '✓', text: 'Đã uống đúng giờ' };
    }
    if (status === 'skipped') {
      return { color: '#F04438', icon: '✕', text: 'Đã bỏ qua' };
    }
    if (status === 'snoozed') {
      return { color: '#7C3AED', icon: '⏰', text: 'Đã hoãn' };
    }
    if (status === 'missed') {
      return { color: '#F04438', icon: '!', text: 'Đã bỏ lỡ' };
    }
    return { color: '#64748B', icon: '○', text: 'Chưa uống' };
  };

  const handleCallPhone = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Lỗi', 'Không có số điện thoại để gọi');
      return;
    }
    
    const phone = phoneNumber.replace(/\s/g, '');
    const phoneUrl = `tel:${phone}`;
    
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Lỗi', 'Thiết bị không hỗ trợ gọi điện');
        } else {
          return Linking.openURL(phoneUrl);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi gọi điện:', err);
        Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
      });
  };

  const handleSendSMS = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Lỗi', 'Không có số điện thoại để nhắn tin');
      return;
    }
    
    const phone = phoneNumber.replace(/\s/g, '');
    const smsUrl = `sms:${phone}`;
    
    Linking.canOpenURL(smsUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Lỗi', 'Thiết bị không hỗ trợ nhắn tin');
        } else {
          return Linking.openURL(smsUrl);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi nhắn tin:', err);
        Alert.alert('Lỗi', 'Không thể mở ứng dụng nhắn tin');
      });
  };

  const handleSaveBloodPressure = async () => {
    if (systolic && diastolic) {
      const sys = Number(systolic);
      const dia = Number(diastolic);
      
      if (isNaN(sys) || isNaN(dia)) {
        Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ cho huyết áp.');
        return;
      }
      if (sys < 70 || sys > 250) {
        Alert.alert('Lỗi', 'Huyết áp tâm thu (systolic) phải từ 70 đến 250 mmHg.');
        return;
      }
      if (dia < 40 || dia > 150) {
        Alert.alert('Lỗi', 'Huyết áp tâm trương (diastolic) phải từ 40 đến 150 mmHg.');
        return;
      }
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy mã người dùng. Vui lòng đăng nhập lại.');
        return;
      }
      try {
        setLoading(true);
        await bloodPressureService.addBloodPressure({
          userId: userId,
          systolic: sys,
          diastolic: dia,
        }, token);
        Alert.alert('Thành công', `Đã ghi nhận chỉ số huyết áp ${sys}/${dia}`);
        setSystolic('');
        setDiastolic('');
        fetchBpHistory();
      } catch (e) {
        Alert.alert('Lỗi', 'Không thể lưu chỉ số huyết áp');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBloodPressureMeasured = () => {
    Alert.alert('Cảm ơn bạn!', 'Đã ghi nhận việc đo huyết áp. Mời bạn nhập kết quả bên dưới.');
    setShowNotification(false);
  };

  const handleBloodPressureSnooze = () => {
    Alert.alert('Đã hẹn giờ nhắc lại', 'Hệ thống sẽ nhắc bạn đo huyết áp sau 10 phút');
    setShowNotification(false);
  };

  // Tạm thời cập nhật local state khi bấm nút
  const handleMarkAsTakenLocal = async (reminderId: string, time: string) => {
    try {
      const originalId = reminderId.split('-')[0];
      
      // Cập nhật local state trước để UI phản hồi ngay lập tức
      setReminders(prevReminders => {
        return prevReminders.map(reminder => {
          if (reminder._id === originalId) {
            return {
              ...reminder,
              repeatTimes: reminder.repeatTimes?.map(rt => {
                if (rt.time === time) {
                  return { ...rt, taken: true, status: 'on_time' };
                }
                return rt;
              })
            };
          }
          return reminder;
        });
      });

      // Gọi API để cập nhật server
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);
      
      let status: 'on_time' | 'late' = 'on_time';
      const timeDiff = now.getTime() - reminderTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff > 30) {
        status = 'late';
      }

      await ReminderService.updateReminderStatus(originalId, {
        action: 'take',
        time: time,
        status: status,
      }, token);

      // Refresh để lấy data mới từ server
      await fetchReminders();
      
      Alert.alert(
        'Thành công', 
        status === 'on_time' 
          ? 'Đã đánh dấu đã uống thuốc đúng giờ' 
          : 'Đã đánh dấu đã uống thuốc (muộn)'
      );
      
    } catch (e) {
      console.error('Error updating reminder status:', e);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái uống thuốc');
      // Refresh để đồng bộ lại với server
      await fetchReminders();
    }
  };

  const handleSkipMedicationLocal = async (reminderId: string, time: string) => {
    try {
      const originalId = reminderId.split('-')[0];
      
      // Cập nhật local state trước
      setReminders(prevReminders => {
        return prevReminders.map(reminder => {
          if (reminder._id === originalId) {
            return {
              ...reminder,
              repeatTimes: reminder.repeatTimes?.map(rt => {
                if (rt.time === time) {
                  return { ...rt, taken: false, status: 'skipped' };
                }
                return rt;
              })
            };
          }
          return reminder;
        });
      });

      // Gọi API
      await ReminderService.updateReminderStatus(originalId, {
        action: 'skip',
        time: time,
        status: 'skipped',
      }, token);

      await fetchReminders();
      Alert.alert('Đã bỏ qua', 'Đã đánh dấu bỏ qua lần uống thuốc này');
      
    } catch (e) {
      console.error('Error skipping medication:', e);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      await fetchReminders();
    }
  };

  const handleSnoozeMedicationLocal = async (reminderId: string, time: string) => {
    try {
      const originalId = reminderId.split('-')[0];
      
      // Cập nhật local state trước
      setReminders(prevReminders => {
        return prevReminders.map(reminder => {
          if (reminder._id === originalId) {
            return {
              ...reminder,
              repeatTimes: reminder.repeatTimes?.map(rt => {
                if (rt.time === time) {
                  return { ...rt, status: 'snoozed' };
                }
                return rt;
              })
            };
          }
          return reminder;
        });
      });

      // Gọi API
      await ReminderService.updateReminderStatus(originalId, {
        action: 'snooze',
        time: time,
        status: 'snoozed',
      }, token);

      await fetchReminders();
      Alert.alert('Đã hoãn', 'Sẽ nhắc lại sau 10 phút');
      
    } catch (e) {
      console.error('Error snoozing medication:', e);
      Alert.alert('Lỗi', 'Không thể hoãn lịch nhắc');
      await fetchReminders();
    }
  };

  const todayReminders = getTodayReminders();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{marginBottom: 18}}>
        <LinearGradient colors={userType === 'patient' ? ["#F0F6FF", "#F0F6FF"] : ["#F7B2B7", "#A8E6CF"]} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, {color: '#1E293B'}]}>{userType === 'patient' ? 'Chào buổi sáng!' : 'Theo dõi người thân'}</Text>
              <Text style={[styles.username, {color: '#3B82F6'}]}>{userType === 'patient' ? 'Bạn cảm thấy thế nào?' : 'Mẹ Nguyễn Thị Lan'}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {userType === 'patient' && (
                <TouchableOpacity onPress={() => setShowNotification(!showNotification)} style={{marginRight: 10}}>
                  <View>
                    <Ionicons name="notifications" size={28} color="#3B82F6" />
                    <View style={{position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: '#F04438', borderRadius: 5}} />
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onLogout}>
                <Ionicons name="person-circle" size={32} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Blood Pressure Notification Modal */}
      {userType === 'patient' && showNotification && (
        <View style={styles.notificationModal}>
          <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 8}}>Đã đến giờ đo huyết áp!</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity style={styles.modalBtn} onPress={handleBloodPressureMeasured}>
              <Text style={{color: '#fff'}}>Đã đo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#A0A4A8'}]} onPress={handleBloodPressureSnooze}>
              <Text style={{color: '#fff'}}>Nhắc lại sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* AI Health Insights - for family */}
      {userType === 'family' && (
        <View style={[styles.section, {backgroundColor: '#F7B2B7', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F7B2B7', marginBottom: 18}]}> 
          <View style={{alignItems: 'center', marginBottom: 10}}>
            <LinearGradient colors={["#F7B2B7", "#A8E6CF"]} style={{width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center'}}>
              <Feather name="shield" size={32} color="#fff" />
            </LinearGradient>
            <Text style={{fontWeight: 'bold', fontSize: 18, color: '#222', marginTop: 8}}>Mẹ Nguyễn Thị Lan</Text>
            <Text style={{color: '#666'}}>Tình trạng hôm nay: Tốt</Text>
          </View>
        </View>
      )}

      {/* Patient UI */}
      {userType === 'patient' ? (
        <>
          {/* Greeting Card */}
          <View style={[styles.section, {
            backgroundColor: '#F0F6FF',
            borderRadius: 24,
            padding: 18,
            borderWidth: 1,
            borderColor: '#B6D5FA',
            marginBottom: 18
          }]}> 
            <View style={{alignItems: 'center', marginBottom: 10}}>
              <View style={{width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B6D5FA'}}>
                <FontAwesome name="heart" size={32} color="#3B82F6" />
              </View>
              <Text style={{color: '#64748B', marginTop: 8}}>Hôm nay bạn cảm thấy thế nào?</Text>
            </View>
          </View>

          {/* Blood Pressure Input Section */}
          <View style={[styles.section, {
            backgroundColor: '#F0F6FF',
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: '#B6D5FA',
            shadowColor: '#F0F6FF',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 1
          }]}> 
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: '#1E293B'}}>
              <FontAwesome5 name="heartbeat" size={18} color="#3B82F6" />  Cập nhật huyết áp
            </Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
              <View style={{flex: 1, marginRight: 8}}>
                <Text style={{fontSize: 14, color: '#64748B', marginBottom: 4}}>Tâm thu</Text>
                <TextInput
                  style={[styles.bpInput, {backgroundColor: '#fff', borderColor: '#B6D5FA', color: '#1E293B'}]}
                  keyboardType="numeric"
                  placeholder="120"
                  placeholderTextColor="#B6D5FA"
                  value={systolic}
                  onChangeText={setSystolic}
                />
              </View>
              <View style={{flex: 1, marginLeft: 8}}>
                <Text style={{fontSize: 14, color: '#64748B', marginBottom: 4}}>Tâm trương</Text>
                <TextInput
                  style={[styles.bpInput, {backgroundColor: '#fff', borderColor: '#B6D5FA', color: '#1E293B'}]}
                  keyboardType="numeric"
                  placeholder="80"
                  placeholderTextColor="#B6D5FA"
                  value={diastolic}
                  onChangeText={setDiastolic}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, {
                backgroundColor: systolic && diastolic ? '#3B82F6' : '#B6D5FA',
                borderRadius: 10,
                paddingVertical: 12,
                marginTop: 6,
              }]}
              onPress={handleSaveBloodPressure}
              disabled={!systolic || !diastolic}
            >
              <FontAwesome name="plus" size={18} color={systolic && diastolic ? '#fff' : '#3B82F6'} />
              <Text style={{color: systolic && diastolic ? '#fff' : '#3B82F6', fontWeight: 'bold', marginLeft: 8}}>Lưu kết quả</Text>
            </TouchableOpacity>

            {/* Recent readings */}
            <View style={{marginTop: 18, borderTopWidth: 1, borderTopColor: '#B6D5FA', paddingTop: 10}}>
              <Text style={{fontWeight: 'bold', color: '#3B82F6', marginBottom: 8}}>📊 Kết quả gần đây</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                bpHistory && bpHistory.length > 0 ? (
                  bpHistory.slice(0, 3).map((item, idx) => {
                    const date = item.measuredAt ? new Date(item.measuredAt) : null;
                    let label = '';
                    if (date) {
                      const now = new Date();
                      const getYMD = (d: Date) => d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
                      const getDMY = (d: Date) => d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth()+1).toString().padStart(2, '0') + '/' + d.getFullYear();
                      const ymdNow = getYMD(now);
                      const ymdDate = getYMD(date);
                      const dmyDate = getDMY(date);
                      const dateOnlyNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const dateOnlyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      const diff = Math.round((dateOnlyNow.getTime() - dateOnlyDate.getTime()) / (1000 * 60 * 60 * 24));
                      if (ymdNow === ymdDate) label = `Hôm nay - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${dmyDate})`;
                      else if (diff === 1) label = `Hôm qua - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${dmyDate})`;
                      else label = `${diff} ngày trước - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${dmyDate})`;
                    }
                    
                    let color = '#12B76A';
                    let reason = '';
                    const sys = item.systolic;
                    const dia = item.diastolic;
                    if (sys < 90 || dia < 60) {
                      color = '#F04438';
                      reason = 'Hạ huyết áp';
                    } else if (sys >= 140 || dia >= 90) {
                      color = '#F04438';
                      reason = 'Tăng huyết áp';
                    } else {
                      color = '#12B76A';
                      reason = 'Bình thường';
                    }
                    return (
                      <View key={item._id || idx} style={{backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#B6D5FA'}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                          <Text style={{color: '#64748B'}}>{label || '---'}</Text>
                          <Text style={{fontWeight: 'bold', color, fontSize: 16}}>{item.systolic}/{item.diastolic}</Text>
                        </View>
                        <Text style={{color, fontSize: 13, marginTop: 2}}>
                          {reason === 'Bình thường' ? 'Huyết áp bình thường' : reason === 'Tăng huyết áp' ? 'Tăng huyết áp - nên nghỉ ngơi, theo dõi hoặc hỏi ý kiến bác sĩ' : 'Hạ huyết áp - nên nghỉ ngơi, uống nước và theo dõi'}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{color: '#64748B'}}>Chưa có dữ liệu</Text>
                )
              )}
            </View>
          </View>

          {/* Thẻ thuốc */}
          <View style={[styles.section, {
            backgroundColor: '#F0F6FF',
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: '#B6D5FA',
            shadowColor: '#F0F6FF',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 1
          }]}> 
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: '#1E293B'}}>
              <Ionicons name="notifications" size={18} color="#3B82F6" />  Lịch uống thuốc hôm nay
            </Text>
            
            {loadingReminders ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : todayReminders && todayReminders.length > 0 ? (
              todayReminders
                .sort((a, b) => {
                  const timeA = a.time.split(':').map(Number);
                  const timeB = b.time.split(':').map(Number);
                  return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                })
                .map((reminder, index) => {
                  console.log('Rendering reminder:', reminder);
                  const statusDisplay = getStatusDisplay(reminder.status, reminder.taken);
                  const isCompleted = reminder.taken || reminder.status === 'on_time' || reminder.status === 'late';
                  const isSkipped = reminder.status === 'skipped';
                  const isSnoozed = reminder.status === 'snoozed';
                  
                  console.log('Reminder display state:', {
                    id: reminder._id,
                    time: reminder.time,
                    status: reminder.status,
                    taken: reminder.taken,
                    isCompleted,
                    statusDisplay
                  });
                  
                  return (
                    <View 
                      key={`${reminder._id}-${index}`}
                      style={{
                        backgroundColor: '#fff', 
                        borderRadius: 12, 
                        padding: 12, 
                        marginBottom: 8, 
                        borderWidth: 1, 
                        borderColor: statusDisplay.color,
                        opacity: isSkipped ? 0.7 : 1
                      }}
                    >
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <View style={{flex: 1}}>
                          <Text style={{fontWeight: 'bold', color: statusDisplay.color}}>
                            {reminder.medicationName} {reminder.dosage}
                          </Text>
                          <Text style={{color: '#64748B', fontSize: 13}}>
                            {reminder.time} - {reminder.timeLabel}
                          </Text>
                          {reminder.note && (
                            <Text style={{color: '#94A3B8', fontSize: 12, marginTop: 2}}>
                              {reminder.note}
                            </Text>
                          )}
                          <Text style={{color: statusDisplay.color, fontSize: 12, fontWeight: '600', marginTop: 4}}>
                            {statusDisplay.icon} {statusDisplay.text}
                          </Text>
                        </View>
                        
                        {isCompleted ? (
                          <Text style={{color: statusDisplay.color, fontSize: 22}}>{statusDisplay.icon}</Text>
                        ) : isSkipped ? (
                          <Text style={{color: statusDisplay.color, fontSize: 22}}>✕</Text>
                        ) : (
                          <View style={{flexDirection: 'row', gap: 4}}>
                            <TouchableOpacity 
                              style={{backgroundColor: '#3B82F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6}}
                              onPress={() => handleMarkAsTakenLocal(reminder._id, reminder.time)}
                            >
                              <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>Uống</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={{backgroundColor: '#F79009', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6}}
                              onPress={() => handleSnoozeMedicationLocal(reminder._id, reminder.time)}
                            >
                              <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>Hoãn</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={{backgroundColor: '#F04438', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6}}
                              onPress={() => handleSkipMedicationLocal(reminder._id, reminder.time)}
                            >
                              <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>Bỏ qua</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
            ) : (
              <View style={{backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#B6D5FA', alignItems: 'center'}}>
                <Ionicons name="calendar-outline" size={32} color="#B6D5FA" />
                <Text style={{color: '#64748B', marginTop: 8, textAlign: 'center'}}>
                  Chưa có lịch uống thuốc hôm nay
                </Text>
              </View>
            )}
          </View>

          {/* Bảng điều khiển gia đình */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 18,
            marginHorizontal: 20,
            marginBottom: 18,
            borderWidth: 1.5,
            borderColor: '#B6D5FA',
            shadowColor: '#F0F6FF',
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 1
          }}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
              <FontAwesome5 name="users" size={22} color="#3B82F6" style={{marginRight: 8}} />
              <Text style={{fontWeight: 'bold', fontSize: 17, color: '#1E293B'}}>
                Bảng điều khiển gia đình
              </Text>
            </View>
            
            {loadingRelatives ? (
              <View style={{alignItems: 'center', paddingVertical: 20}}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={{color: '#64748B', marginTop: 8}}>Đang tải danh sách người thân...</Text>
              </View>
            ) : relatives.length > 0 ? (
              <View>
                {relatives.map((item, index) => {
                  const relative = item.relative;
                  return (
                    <View key={item._id || index} style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2
                    }}>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                        {relative?.avatar && relative.avatar.trim() !== '' ? (
                          <Image 
                            source={{ uri: relative.avatar }}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              marginRight: 12,
                              backgroundColor: '#E2E8F0'
                            }}
                          />
                        ) : (
                          <View style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: '#3B82F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12
                          }}>
                            <Text style={{
                              color: '#fff',
                              fontSize: 18,
                              fontWeight: 'bold'
                            }}>
                              {relative?.fullName ? relative.fullName.charAt(0).toUpperCase() : 'T'}
                            </Text>
                          </View>
                        )}
                        
                        <View style={{flex: 1}}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: '#1E293B',
                            lineHeight: 20
                          }}>
                            {relative?.fullName || 'Người thân'}
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            color: '#3B82F6',
                            marginTop: 4
                          }}>
                            {relative?.email || ''}
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            color: '#64748B',
                            marginBottom: 8
                          }}>
                            {relative?.phoneNumber || ''}
                          </Text>
                          
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 8
                          }}>
                            <TouchableOpacity 
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderColor: '#3B82F6',
                                borderRadius: 8,
                                paddingVertical: 8,
                                paddingHorizontal: 12
                              }}
                              onPress={() => handleCallPhone(relative?.phoneNumber)}
                            >
                              <Ionicons name="call" size={16} color="#3B82F6" style={{marginRight: 4}} />
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#3B82F6'
                              }}>
                                Gọi
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderColor: '#3B82F6',
                                borderRadius: 8,
                                paddingVertical: 8,
                                paddingHorizontal: 12
                              }}
                              onPress={() => handleSendSMS(relative?.phoneNumber)}
                            >
                              <Ionicons name="chatbubble" size={16} color="#3B82F6" style={{marginRight: 4}} />
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#3B82F6'
                              }}>
                                Nhắn tin
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{alignItems: 'center', paddingVertical: 20}}>
                <Ionicons name="people-outline" size={48} color="#B6D5FA" />
                <Text style={{color: '#64748B', fontSize: 15, textAlign: 'center', marginTop: 8}}>
                  Chưa có người thân nào theo dõi sức khỏe của bạn.
                </Text>
                <TouchableOpacity style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginTop: 12
                }}>
                  <Text style={{color: '#fff', fontSize: 14, fontWeight: 'bold'}}>
                    Mời người thân
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          <View style={[styles.section, {backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#A8E6CF'}]}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10}}>
              <FontAwesome5 name="heartbeat" size={18} color="#4CB8C4" />  Tổng kết tuần
            </Text>
            <View style={{backgroundColor: '#A8E6CF', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Tuân thủ lịch uống thuốc</Text>
                <Text style={{color: '#666', fontSize: 13}}>6/7 ngày</Text>
              </View>
              <Text style={{color: '#388E3C', fontSize: 18, fontWeight: 'bold'}}>86%</Text>
            </View>
            <View style={{backgroundColor: '#E0F7FA', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Đo huyết áp đều đặn</Text>
                <Text style={{color: '#666', fontSize: 13}}>7/7 ngày</Text>
              </View>
              <Text style={{color: '#009688', fontSize: 18, fontWeight: 'bold'}}>100%</Text>
            </View>
            <View style={{backgroundColor: '#F7B2B7', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Chỉ số huyết áp trung bình</Text>
                <Text style={{color: '#666', fontSize: 13}}>Trong tuần</Text>
              </View>
              <Text style={{color: '#E91E63', fontSize: 18, fontWeight: 'bold'}}>125/82</Text>
            </View>
          </View>

          <View style={[styles.section, {backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#A0A4A8'}]}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10}}>
              <FontAwesome5 name="users" size={18} color="#4CB8C4" />  Bảng điều khiển gia đình (demo)
            </Text>
            <Text style={{color: '#666'}}>Theo dõi sức khỏe người thân trong thời gian thực.</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 24,
    paddingTop: 0,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
    marginHorizontal: 20,
  },
  notificationModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FFD600',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: '#4CB8C4',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  bpInput: {
    borderWidth: 1,
    borderColor: '#A0A4A8',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#F6F8FB',
    textAlign: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 0,
  },
});

export default HomeScreen;