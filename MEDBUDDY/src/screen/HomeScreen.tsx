import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, FontAwesome, Feather } from '@expo/vector-icons';
import bloodPressureService, { BloodPressure } from '../api/bloodPressure';
import RelativePatientService from '../api/RelativePatient';
import ReminderService from '../api/Reminders';
import UserPackageService from '../api/UserPackage';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';

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
  const [currentPackage, setCurrentPackage] = useState<{type: string, name: string, daysLeft?: number}>({type: 'trial', name: 'Gói dùng thử'});
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingSpecificAI, setLoadingSpecificAI] = useState<string | null>(null);
  const route = useRoute();
  const navigation = useNavigation();
  
  const token = (route.params as any)?.token || '';
  const userId = (route.params as any)?.userId || '';


  // Lấy dữ liệu khi vào màn hình
  useEffect(() => {
    if (!token) return;
    fetchBpHistory();
    fetchRelatives();
    fetchReminders();
    fetchCurrentPackage();
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      // Khi màn hình được focus, tự động reload dữ liệu
      if (!token) return;
      fetchBpHistory();
      fetchRelatives();
      fetchReminders();
      fetchCurrentPackage();
    }, [token])
  );

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
      // Ignore error
    } finally {
      setLoadingRelatives(false);
    }
  };

  // Lấy thông tin gói hiện tại từ API
  const fetchCurrentPackage = async () => {
    if (!token) return;
    try {
      const packageData = await UserPackageService.getMyActivePackage(token);
      
      if (packageData && packageData.data && packageData.data.package) {
        const packageName = packageData.data.package.name;
        
        // Logic xác định gói dựa trên tên gói
        const isTrial = packageName.toLowerCase().includes('dùng thử') || 
                       packageName.toLowerCase().includes('trial') ||
                       packageName.toLowerCase().includes('miễn phí');
        
        setCurrentPackage({
          type: isTrial ? 'trial' : 'pro',
          name: packageName,
          daysLeft: packageData.data.daysRemaining
        });
      } else {
        // Fallback nếu không có gói active
        setCurrentPackage({type: 'trial', name: 'Gói dùng thử'});
      }
    } catch (e) {
      // Fallback về trial nếu API lỗi
      setCurrentPackage({type: 'trial', name: 'Gói dùng thử'});
    }
  };

  // Lấy danh sách lịch uống thuốc hôm nay với status
  const fetchReminders = async () => {
    if (!token) return;
    setLoadingReminders(true);
    try {
      const remindersData = await ReminderService.getReminders(token);
      console.log('DEBUG: getReminders raw response:', remindersData);

      // remindersData can be either an array or an object with a data field
      let remindersList: any[] = [];
      if (Array.isArray(remindersData)) {
        remindersList = remindersData as any[];
      } else if (remindersData && Array.isArray((remindersData as any).data)) {
        remindersList = (remindersData as any).data;
      } else if (remindersData && Array.isArray((remindersData as any).data?.data)) {
        // handle nested data.data
        remindersList = (remindersData as any).data.data;
      } else {
        remindersList = [];
      }

      // If the list already contains repeatTimes, use it directly; otherwise fetch detail per reminder
      const detailedReminders = await Promise.all(
        remindersList.map(async (reminder: any) => {
          // If reminder already contains repeatTimes, use it
          let detailData: any = reminder;
          if (!Array.isArray(reminder.repeatTimes) || reminder.repeatTimes.length === 0) {
            try {
              detailData = await ReminderService.getReminderById(reminder._id, token);
              if (detailData && detailData.data) detailData = detailData.data;
            } catch (err) {
              console.error('DEBUG: error fetching detail for reminder', reminder._id, err);
              // fallback to the basic reminder object
              detailData = reminder;
            }
          }

          // Try to fetch status details and merge into repeatTimes when possible
          try {
            const statusResponse = await ReminderService.getReminderStatus(reminder._id, token);
            // Kiểm tra structure của response
            let statusDetails: any = null;
            if (statusResponse?.statusDetails) statusDetails = statusResponse.statusDetails;
            else if (Array.isArray(statusResponse)) statusDetails = statusResponse;
            else if (statusResponse?.data) statusDetails = statusResponse.data;

            if (statusDetails && Array.isArray(statusDetails) && Array.isArray((detailData as any).repeatTimes)) {
              (detailData as any).repeatTimes = (detailData as any).repeatTimes.map((rt: any) => {
                const statusDetail = statusDetails.find((sd: any) => sd.time === rt.time);
                if (statusDetail) {
                  return { ...rt, taken: statusDetail.taken, status: statusDetail.status, takenAt: statusDetail.takenAt };
                }
                return rt;
              });
            }
          } catch (statusError) {
            console.error('DEBUG: error fetching status for reminder', reminder._id, statusError);
          }

          return detailData;
        })
      );
  console.log('DEBUG: detailedReminders prepared:', detailedReminders);
  setReminders(detailedReminders as DetailedReminder[]);
  console.log('DEBUG: state reminders set, length=', (detailedReminders || []).length);
    } catch (e) {
      // Ignore error
    } finally {
      setLoadingReminders(false);
    }
  };

  // Flatten reminders - GIỐNG MedicationScheduleScreen
  const flattenReminders = (reminders: DetailedReminder[]): FlattenedReminder[] => {
    const flattened: FlattenedReminder[] = [];

    reminders.forEach(reminder => {
      // Normalize possible shapes
      const repeatTimesAny: any[] = Array.isArray((reminder as any).repeatTimes)
        ? (reminder as any).repeatTimes
        : Array.isArray((reminder as any).data?.repeatTimes)
        ? (reminder as any).data.repeatTimes
        : [];

      const timesAny: any[] = Array.isArray((reminder as any).times)
        ? (reminder as any).times
        : Array.isArray((reminder as any).data?.times)
        ? (reminder as any).data.times
        : [];

      if (repeatTimesAny.length > 0) {
        repeatTimesAny.forEach((repeatTime: any, index: number) => {
          const timeLabel = timesAny[index]?.time || 'Không xác định';

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

    console.log('DEBUG: flattenReminders output:', flattened);
    return flattened;
  };

  // Lấy reminders cho hôm nay
  const getTodayReminders = (): FlattenedReminder[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const flattenedReminders = flattenReminders(reminders);
    console.log('DEBUG: flattenedReminders (all):', flattenedReminders);
    
    return flattenedReminders.filter(reminder => {
      // Tìm reminder gốc để check startDate/endDate
      const originalReminder = reminders.find(r => reminder._id.startsWith(r._id));
      if (!originalReminder) {
        console.warn('DEBUG: originalReminder not found for flattened id', reminder._id);
      }
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

      const result = await ReminderService.updateReminderStatus(originalId, {
        action: 'take',
        time: time,
        status: status,
      }, token);
      
      Alert.alert(
        'Thành công', 
        status === 'on_time' 
          ? 'Đã đánh dấu đã uống thuốc đúng giờ' 
          : 'Đã đánh dấu đã uống thuốc (muộn)'
      );
      
      // Refresh ngay lập tức
      await fetchReminders();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái uống thuốc');
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

  const getStatusDisplay = (status?: string, taken?: boolean) => {
    
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
      Alert.alert('Lỗi', 'Không thể hoãn lịch nhắc');
      await fetchReminders();
    }
  };

  // AI Analysis Functions
  const handleAnalyzeSpecificBP = async (bloodPressureId: string) => {
    try {
      setLoadingSpecificAI(bloodPressureId);
      console.log('Calling analyzeSpecificBP API with ID:', bloodPressureId);
      const response = await bloodPressureService.analyzeSpecificBP(bloodPressureId, token);
      console.log('analyzeSpecificBP response:', response);
      setAiAnalysisResult(response.data || response);
      setShowAIModal(true);
    } catch (error) {
      console.error('analyzeSpecificBP error:', error);
      Alert.alert('Lỗi', 'Không thể phân tích huyết áp này');
    } finally {
      setLoadingSpecificAI(null);
    }
  };

  const handleGetAIInsights = async () => {
    try {
      setLoadingAI(true);
      console.log('Calling getAIInsights API...');
      const response = await bloodPressureService.getAIInsights(userId, token, 10);
      console.log('getAIInsights response:', response);
      
      // Xử lý response có thể có cấu trúc khác
      const data = response.data || response;
      const insights = data.insights || data.analyses || data || [];
      
      console.log('Processed insights:', insights);
      setAiInsights(Array.isArray(insights) ? insights : []);
      
      if (insights.length === 0) {
        Alert.alert('Thông báo', 'Chưa có dữ liệu phân tích AI. Hãy đo huyết áp vài lần trước.');
      } else {
        // Hiện modal với tất cả insights
        setAiAnalysisResult({
          userName: 'Người dùng',
          insights: insights,
          type: 'insights_summary'
        });
        setShowAIModal(true);
      }
    } catch (error) {
      console.error('getAIInsights error:', error);
      Alert.alert('Lỗi', 'Không thể lấy AI insights');
    } finally {
      setLoadingAI(false);
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
                  {/* <View>
                    <Ionicons name="notifications" size={28} color="#3B82F6" />
                    <View style={{position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: '#F04438', borderRadius: 5}} />
                  </View> */}
                </TouchableOpacity>
              )}
              
              {/* LUÔN hiển thị badge gói thay vì icon profile */}
              <TouchableOpacity 
                style={styles.packageBadge}
                onPress={() => (navigation as any).navigate('CurrentPackage')}
              >
                <View style={styles.badgeContainer}>
                  {currentPackage.type === 'trial' ? (
                    <View style={styles.trialIcon}>
                      <Ionicons name="time" size={16} color="#fff" />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      style={styles.proIcon}
                    >
                      <Ionicons name="star" size={16} color="#fff" />
                    </LinearGradient>
                  )}
                  <Text style={[
                    styles.packageText,
                    {color: currentPackage.type === 'trial' ? '#FFD700' : '#FFD700'}
                  ]}>
                    {currentPackage.type === 'trial' ? 'DÙNG THỬ' : 'TRẢ PHÍ'}
                  </Text>
                </View>
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
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={{fontWeight: 'bold', color, fontSize: 16, marginRight: 8}}>
                              {item.systolic}/{item.diastolic}
                            </Text>
                            <TouchableOpacity 
                              style={{
                                backgroundColor: '#8B5CF6',
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                flexDirection: 'row',
                                alignItems: 'center'
                              }}
                              onPress={() => handleAnalyzeSpecificBP(item._id || '')}
                              disabled={loadingSpecificAI === item._id}
                            >
                              {loadingSpecificAI === item._id ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <>
                                  <Ionicons name="sparkles" size={12} color="#fff" />
                                  <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4}}>
                                    AI
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
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

            {/* AI Analysis Section - Ẩn khi modal đang hiện */}
            {!showAIModal && (
          <View style={{marginTop: 18, borderTopWidth: 1, borderTopColor: '#B6D5FA', paddingTop: 10}}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
              <Text style={{fontWeight: 'bold', color: '#8B5CF6'}}>🤖 AI Phân tích</Text>
              <TouchableOpacity 
                style={{
                  backgroundColor: '#8B5CF6',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
                onPress={handleGetAIInsights}
                disabled={loadingAI}
              >
                {loadingAI ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={12} color="#fff" />
                    <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4}}>
                      Cập nhật
                    </Text>
                  </>
                )}
              </TouchableOpacity>
          </View>
            
            {aiInsights.length > 0 ? (
              aiInsights.slice(0, 3).map((insight, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: insight.riskLevel === 'cao' ? '#F59E0B' : 
                               insight.riskLevel === 'trung bình' ? '#F79009' : '#8B5CF6'
                  }}
                  onPress={() => {
                    setAiAnalysisResult(insight);
                    setShowAIModal(true);
                  }}
                  >
                    <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                      <Text style={{fontSize: 16, marginRight: 8}}>
                        {insight.riskLevel === 'cao' ? '🚨' : 
                         insight.riskLevel === 'trung bình' ? '⚠️' : '💡'}
                      </Text>
                      <View style={{flex: 1}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                          <Text style={{fontWeight: 'bold', color: '#1E293B', fontSize: 13}}>
                            Phân tích {index + 1}
                          </Text>
                          <View style={{
                            backgroundColor: insight.riskLevel === 'cao' ? '#FEF2F2' : 
                                           insight.riskLevel === 'trung bình' ? '#FFFBEB' : '#ECFDF5',
                            borderRadius: 4,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            marginLeft: 8
                          }}>
                            <Text style={{
                              fontSize: 10,
                              fontWeight: 'bold',
                              color: insight.riskLevel === 'cao' ? '#DC2626' : 
                                    insight.riskLevel === 'trung bình' ? '#D97706' : '#059669'
                            }}>
                              {insight.riskLevel?.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={{color: '#64748B', fontSize: 12, marginBottom: 4}}>
                          {insight.summary}
                        </Text>
                        <Text style={{color: '#475569', fontSize: 11, fontStyle: 'italic'}}>
                          📅 {new Date(insight.analyzedAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View>
                  <TouchableOpacity 
                    style={{
                      backgroundColor: '#F1F5F9',
                      borderRadius: 8,
                      padding: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderStyle: 'dashed'
                    }}
                    onPress={handleGetAIInsights}
                    disabled={loadingAI}
                  >
                    {loadingAI ? (
                      <ActivityIndicator size="small" color="#8B5CF6" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                        <Text style={{color: '#8B5CF6', fontWeight: 'bold', marginTop: 4}}>
                          Lấy phân tích AI
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <Text style={{
                    color: '#64748B',
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 8,
                    fontStyle: 'italic'
                  }}>
                    Phân tích tổng hợp dựa trên lịch sử đo huyết áp
                  </Text>
                </View>
              )}
            </View>
          )}
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
                  const statusDisplay = getStatusDisplay(reminder.status, reminder.taken);
                  const isCompleted = reminder.taken || reminder.status === 'on_time' || reminder.status === 'late';
                  const isSkipped = reminder.status === 'skipped';
                  const isSnoozed = reminder.status === 'snoozed';
                  
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
                            Tên: 
                            {relative?.fullName || 'Người thân'}
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            color: '#3B82F6',
                            marginTop: 4
                          }}>
                            Email:
                            {relative?.email || ''}
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            color: '#64748B',
                            marginBottom: 8
                          }}>
                            Số điện thoại:
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
<TouchableOpacity
  style={{
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12
  }}
  onPress={() => (navigation as any).navigate('HealthTracking')}
>
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

      {/* AI Analysis Modal */}
      <Modal visible={showAIModal} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 20,
            width: '100%',
            maxHeight: '80%'
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {aiAnalysisResult?.type !== 'insights_summary' && (
                  <TouchableOpacity 
                    onPress={() => {
                      // Quay lại danh sách tổng hợp
                      setAiAnalysisResult({
                        userName: 'Người dùng',
                        insights: aiInsights,
                        type: 'insights_summary'
                      });
                    }}
                    style={{marginRight: 8}}
                  >
                    <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
                  </TouchableOpacity>
                )}
                <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginLeft: 8,
                  color: '#1E293B'
                }}>
                  {aiAnalysisResult?.type === 'insights_summary' ? 'Tổng hợp AI Insights' : 'Chi tiết phân tích'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {loadingAI ? (
              <View style={{alignItems: 'center', paddingVertical: 40}}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={{color: '#64748B', marginTop: 12}}>Đang phân tích...</Text>
              </View>
            ) : aiAnalysisResult ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#3B82F6',
                  marginBottom: 15
                }}>{aiAnalysisResult?.userName || 'Người dùng'}</Text>
                
                {aiAnalysisResult?.riskLevel && (
                  <View style={{
                    flexDirection: 'row',
                    gap: 8,
                    marginBottom: 12
                  }}>
                    <View style={{
                      backgroundColor: aiAnalysisResult?.riskLevel === 'cao' ? '#FEF2F2' : 
                                     aiAnalysisResult?.riskLevel === 'trung bình' ? '#FFFBEB' : 
                                     aiAnalysisResult?.riskLevel === 'nhẹ' ? '#FFFBEB' : '#ECFDF5',
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: aiAnalysisResult?.riskLevel === 'cao' ? '#FCA5A5' : 
                                 aiAnalysisResult?.riskLevel === 'trung bình' ? '#FDE68A' : 
                                 aiAnalysisResult?.riskLevel === 'nhẹ' ? '#FDE68A' : '#A7F3D0'
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: aiAnalysisResult?.riskLevel === 'cao' ? '#DC2626' : 
                              aiAnalysisResult?.riskLevel === 'trung bình' ? '#D97706' : 
                              aiAnalysisResult?.riskLevel === 'nhẹ' ? '#D97706' : '#059669'
                      }}>
                        {aiAnalysisResult?.riskLevel === 'cao' ? '🚨' : 
                         aiAnalysisResult?.riskLevel === 'trung bình' ? '⚠️' : 
                         aiAnalysisResult?.riskLevel === 'nhẹ' ? '⚠️' : '💡'} {aiAnalysisResult?.riskLevel?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
                
                {aiAnalysisResult?.summary && (
                  <View style={{
                    backgroundColor: '#EFF6FF',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#3B82F6'
                  }}>
                    <Text style={{
                      fontWeight: 'bold',
                      color: '#1E293B',
                      marginBottom: 4
                    }}>📋 Tóm tắt</Text>
                    <Text style={{
                      color: '#475569',
                      fontSize: 14
                    }}>{aiAnalysisResult?.summary}</Text>
                  </View>
                )}

                {(aiAnalysisResult?.riskScore || aiAnalysisResult?.analyzedAt) && (
                  <View style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0'
                  }}>
                    <Text style={{
                      fontWeight: 'bold',
                      color: '#1E293B',
                      marginBottom: 8
                    }}>📊 Thông tin chi tiết</Text>
                    
                    {aiAnalysisResult?.riskScore && (
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                        <Text style={{color: '#64748B', fontSize: 14}}>Điểm rủi ro:</Text>
                        <Text style={{
                          color: aiAnalysisResult?.riskScore >= 60 ? '#DC2626' : 
                                aiAnalysisResult?.riskScore >= 40 ? '#D97706' : '#059669',
                          fontWeight: 'bold'
                        }}>{aiAnalysisResult?.riskScore}/100</Text>
                      </View>
                    )}
                    
                    {aiAnalysisResult?.analyzedAt && (
                      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        <Text style={{color: '#64748B', fontSize: 14}}>Thời gian phân tích:</Text>
                        <Text style={{color: '#475569', fontSize: 14}}>
                          {new Date(aiAnalysisResult?.analyzedAt).toLocaleString('vi-VN')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                
                {aiAnalysisResult?.type === 'insights_summary' && aiAnalysisResult?.insights ? (
                  aiAnalysisResult.insights.map((insight: any, index: number) => (
                    <TouchableOpacity 
                      key={index} 
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 12,
                        padding: 15,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: insight.riskLevel === 'cao' ? '#F59E0B' : 
                                    insight.riskLevel === 'trung bình' ? '#F79009' : '#8B5CF6'
                      }}
                      onPress={() => {
                        setAiAnalysisResult(insight);
                        setShowAIModal(true);
                      }}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                        <Text style={{fontSize: 20, marginRight: 10}}>
                          {insight.riskLevel === 'cao' ? '🚨' : 
                           insight.riskLevel === 'trung bình' ? '⚠️' : '💡'}
                        </Text>
                        <View style={{flex: 1}}>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                            <Text style={{
                              fontWeight: 'bold',
                              color: '#1E293B',
                              fontSize: 16
                            }}>Phân tích {index + 1}</Text>
                            <View style={{
                              backgroundColor: insight.riskLevel === 'cao' ? '#FEF2F2' : 
                                             insight.riskLevel === 'trung bình' ? '#FFFBEB' : '#ECFDF5',
                              borderRadius: 4,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              marginLeft: 8
                            }}>
                              <Text style={{
                                fontSize: 10,
                                fontWeight: 'bold',
                                color: insight.riskLevel === 'cao' ? '#DC2626' : 
                                      insight.riskLevel === 'trung bình' ? '#D97706' : '#059669'
                              }}>
                                {insight.riskLevel?.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text style={{
                            color: '#64748B',
                            fontSize: 14,
                            marginBottom: 8
                          }}>{insight.summary}</Text>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={{
                              color: '#475569',
                              fontSize: 12,
                              fontStyle: 'italic'
                            }}>
                              📅 {new Date(insight.analyzedAt).toLocaleDateString('vi-VN')}
                            </Text>
                            <Text style={{
                              color: insight.riskScore >= 60 ? '#DC2626' : 
                                    insight.riskScore >= 40 ? '#D97706' : '#059669',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}>
                              Điểm: {insight.riskScore}/100
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : aiAnalysisResult?.analyses && aiAnalysisResult.analyses.length > 0 ? (
                  aiAnalysisResult.analyses.map((analysis: any, index: number) => (
                    <View key={index} style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: 12,
                      padding: 15,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: analysis.status === 'warning' ? '#F59E0B' : 
                                  analysis.status === 'info' ? '#3B82F6' : '#10B981'
                    }}>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                        <Text style={{fontSize: 20, marginRight: 10}}>{analysis.icon}</Text>
                        <View style={{flex: 1}}>
                          <Text style={{
                            fontWeight: 'bold',
                            color: '#1E293B',
                            marginBottom: 6
                          }}>{analysis.title}</Text>
                          <Text style={{
                            color: '#64748B',
                            fontSize: 14,
                            marginBottom: 8
                          }}>{analysis.metric}</Text>
                          <Text style={{
                            color: '#475569',
                            fontSize: 13,
                            fontStyle: 'italic'
                          }}>💡 {analysis.recommendation}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{alignItems: 'center', paddingVertical: 20}}>
                    <Ionicons name="information-circle" size={48} color="#8B5CF6" />
                    <Text style={{color: '#64748B', marginTop: 12, textAlign: 'center'}}>
                      Không có dữ liệu phân tích
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={{alignItems: 'center', paddingVertical: 20}}>
                <Ionicons name="alert-circle" size={48} color="#F59E0B" />
                <Text style={{color: '#64748B', marginTop: 12, textAlign: 'center'}}>
                  Không thể tải dữ liệu phân tích
                </Text>
                <TouchableOpacity 
                  style={{
                    backgroundColor: '#8B5CF6',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginTop: 12
                  }}
                  onPress={() => setShowAIModal(false)}
                >
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>Đóng</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  packageBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  proIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  trialIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  packageText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;