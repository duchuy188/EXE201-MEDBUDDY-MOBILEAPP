import React, { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, NativeSyntheticEvent, NativeScrollEvent, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import ReminderService, { Reminder } from '../api/Reminders';
import AppointmentsService from '../api/Appointments';
import * as Notifications from 'expo-notifications';
import { MaterialIcons } from '@expo/vector-icons';

interface Appointment {
  _id: string;
  title: string;
  hospital: string;
  location: string;
  date: string;
  time: string;
  notes?: string;
  status: string;
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
  voice?: 'banmai' | 'lannhi' | 'leminh' | 'myan' | 'thuminh' | 'giahuy' | 'linhsan';
  isActive?: boolean;
  createdAt?: string;
  status?: 'pending' | 'completed' | 'snoozed';
  snoozeTime?: string;
}

interface UpdateReminderStatusPayload {
  action: 'take' | 'skip' | 'snooze';
  time?: string;
  status?: 'pending' | 'on_time' | 'late' | 'missed' | 'skipped' | 'snoozed';
}

interface FlattenedReminder {
  _id: string;
  userId: string;
  time: string;
  timeLabel: string;
  startDate: string;
  endDate: string;
  note?: string;
  isActive?: boolean;
  status?: 'pending' | 'on_time' | 'late' | 'missed' | 'skipped' | 'snoozed'; // Cập nhật status
  medicationId?: {
    _id: string;
    name?: string;
    dosage?: string;
    quantity?: string;
    form?: string;
  };
  taken?: boolean;
}

const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const getDayLabel = (date: Date): string => {
  const day = date.getDay();
  return days[day === 0 ? 6 : day - 1];
};

const MedicationScheduleScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  // @ts-ignore
  const { token, userId } = route.params;
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [activeTab, setActiveTab] = useState('medication');
  const [reminders, setReminders] = useState<DetailedReminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<FlattenedReminder | Appointment | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchReminders = async () => {
    try {
      const remindersData = await ReminderService.getReminders(token);
      console.log('Raw reminders data:', remindersData);
      
      const detailedReminders = await Promise.all(
        remindersData.map(async (reminder: any) => {
          const detailData = await ReminderService.getReminderById(reminder._id, token);
          console.log('Detail data for reminder', reminder._id, ':', detailData);
          
          // Lấy thêm status details từ API
          try {
            console.log('=== Calling getReminderStatus for', reminder._id, '===');
            const statusResponse = await ReminderService.getReminderStatus(reminder._id, token);
            console.log('=== Status response for reminder', reminder._id, ':', statusResponse, '===');
            
            // Kiểm tra các cấu trúc response khác nhau
            let statusDetails = null;
            
            if (statusResponse?.statusDetails) {
              statusDetails = statusResponse.statusDetails;
            } else if (statusResponse?.data?.statusDetails) {
              statusDetails = statusResponse.data.statusDetails;
            } else if (Array.isArray(statusResponse)) {
              statusDetails = statusResponse;
            } else if (statusResponse?.success && statusResponse?.data) {
              statusDetails = statusResponse.data;
            }
            
            console.log('Processed status details:', statusDetails);
            
            if (statusDetails && Array.isArray(statusDetails) && detailData.repeatTimes) {
              detailData.repeatTimes = detailData.repeatTimes.map((rt: any) => {
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
              
              console.log('Updated repeatTimes with status:', detailData.repeatTimes);
            } else {
              console.log('No valid status details found or not array format');
            }
          } catch (statusError) {
            console.error('=== Error fetching status for reminder', reminder._id, '===');
            console.error('Status error message:', statusError.message);
            if (statusError.response) {
              console.error('Status error response status:', statusError.response.status);
              console.error('Status error response data:', statusError.response.data);
            }
          }
          
          return detailData;
        })
      );
      
      console.log('Final detailed reminders with status:', detailedReminders);
      setReminders(detailedReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleReminderAction = async (action: 'take' | 'skip' | 'snooze') => {
    if (!selectedReminder || 'hospital' in selectedReminder) return;

    try {
      const reminderId = selectedReminder._id.split('-')[0];
      
      // Xác định trạng thái dựa trên thời gian và action
      let status: 'on_time' | 'late' | 'skipped' | 'snoozed' = 'on_time';
      
      if (action === 'take') {
        const now = new Date();
        const [hours, minutes] = selectedReminder.time.split(':').map(Number);
        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);
        
        const timeDiff = now.getTime() - reminderTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff > 30) { // Nếu uống muộn hơn 30 phút
          status = 'late';
        }
      } else if (action === 'skip') {
        status = 'skipped';
      } else if (action === 'snooze') {
        status = 'snoozed';
      }
      
      const payload: UpdateReminderStatusPayload = {
        action: action,
        time: selectedReminder.time,
        status: status
      };

      await ReminderService.updateReminderStatus(reminderId, payload, token);
      
      const actionMessages = {
        take: status === 'on_time' 
          ? 'Đã đánh dấu đã uống thuốc đúng giờ' 
          : 'Đã đánh dấu đã uống thuốc (muộn)',
        skip: 'Đã bỏ qua lần uống này',
        snooze: 'Sẽ nhắc lại sau 5 phút'
      };
      
      Alert.alert('Thành công', actionMessages[action]);
      setIsModalVisible(false);
      fetchReminders();
    } catch (error) {
      console.error('Error updating reminder status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại');
    }
  };

  const flattenReminders = (reminders: DetailedReminder[]): FlattenedReminder[] => {
    const flattened: FlattenedReminder[] = [];
    reminders.forEach(reminder => {
      if (reminder.repeatTimes && reminder.repeatTimes.length > 0) {
        reminder.repeatTimes.forEach((repeatTime, index) => {
          // Xác định ngày đang chọn
          const selected = new Date(selectedDate);
          selected.setHours(0, 0, 0, 0);

          // Nếu có takenAt, kiểm tra có trùng ngày không
          let takenDate: Date | null = null;
          if (repeatTime.takenAt) {
            takenDate = new Date(repeatTime.takenAt);
            takenDate.setHours(0, 0, 0, 0);
          }

          // Luôn render nếu trong khoảng startDate - endDate
          const startDate = new Date(reminder.startDate);
          const endDate = new Date(reminder.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          if (selected >= startDate && selected <= endDate) {
            // Nếu có takenAt trùng ngày thì lấy trạng thái, nếu không thì trạng thái mặc định
            const isTakenToday = takenDate && takenDate.getTime() === selected.getTime();
            flattened.push({
              _id: `${reminder._id}-${index}-${repeatTime.time || 'none'}`,
              userId: reminder.userId,
              time: repeatTime.time || 'Chưa đặt giờ',
              timeLabel: reminder.times[index]?.time || 'Không xác định',
              startDate: reminder.startDate,
              endDate: reminder.endDate,
              note: reminder.note,
              isActive: reminder.isActive,
              status: isTakenToday ? repeatTime.status || 'pending' : 'pending',
              medicationId: reminder.medicationId,
              taken: isTakenToday ? repeatTime.taken || false : false
            });
          }
        });
      } 
      else if (reminder.times && reminder.times.length > 0) {
        reminder.times.forEach((timeItem, index) => {
          flattened.push({
            _id: `${reminder._id}-${index}-${timeItem.time}`,
            userId: reminder.userId,
            time: 'Chưa đặt giờ cụ thể',
            timeLabel: timeItem.time,
            startDate: reminder.startDate,
            endDate: reminder.endDate,
            note: reminder.note,
            isActive: reminder.isActive,
            status: 'pending',
            medicationId: reminder.medicationId,
            taken: false
          });
        });
      }
    });
    
    console.log('=== FINAL FLATTENED ARRAY FROM API ===:', flattened);
    return flattened;
  };

  useEffect(() => {
    fetchReminders();
    // testGetReminderStatus(); // Xóa dòng này
  }, [token]);

  const fetchAppointments = async () => {
    try {
      const response = await AppointmentsService.getAppointments(token);
      if (response && response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (activeTab === 'appointment') {
        fetchAppointments();
      }
      fetchReminders();
    });
    return unsubscribe;
  }, [navigation, activeTab]);

  useEffect(() => {
    if (activeTab === 'appointment') {
      fetchAppointments();
    }
  }, [activeTab]);

  // Hàm lấy màu và icon theo trạng thái
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

  // Sửa lại useMemo - đổi tên để tránh nhầm lẫn
  const remindersForSelectedDate = React.useMemo((): FlattenedReminder[] => {
    const flattenedReminders = flattenReminders(reminders);
    
    return flattenedReminders.filter(reminder => {
      const startDate = new Date(reminder.startDate);
      const endDate = new Date(reminder.endDate);
      const current = new Date(selectedDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      current.setHours(0, 0, 0, 0);
      
      return current >= startDate && current <= endDate && reminder.isActive !== false;
    });
  }, [reminders, selectedDate]);

  // Thay thế bằng useEffect đúng
  useEffect(() => {
    remindersForSelectedDate.forEach(reminder => {
      if (reminder.time) {
        const date = new Date(selectedDate);
        const [hour, minute] = reminder.time.split(':').map(Number);
        date.setHours(hour, minute, 0, 0);
        
        if (date > new Date()) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: `Nhắc uống thuốc - ${reminder.timeLabel}`,
              body: reminder.note || `${reminder.medicationId?.name || 'Thuốc'} - ${reminder.medicationId?.dosage || ''}`
            },
            trigger: {
              type: 'calendar',
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              day: date.getDate(),
              hour,
              minute,
              repeats: false
            },
          });
        }
      }
    });
  }, [reminders, selectedDate, remindersForSelectedDate]);

  const getWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setDate(monday.getDate() + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const generateDates = () => {
    return getWeekDates();
  };

  const scrollViewRef = React.useRef<ScrollView>(null);

  const scrollToToday = () => {
    setSelectedDate(new Date());
    setWeekOffset(0);
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  };

  const scheduleLocalNotification = async (title: string, body: string, date: Date, time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const triggerDate = new Date(date);
    triggerDate.setHours(hour, minute, 0, 0);
    if (triggerDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: {
          type: 'calendar',
          year: triggerDate.getFullYear(),
          month: triggerDate.getMonth() + 1,
          day: triggerDate.getDate(),
          hour: triggerDate.getHours(),
          minute: triggerDate.getMinutes(),
          repeats: false
        },
      });
    }
  };

  useEffect(() => {
    appointments.forEach(appointment => {
      if (appointment.date && appointment.time) {
        const title = 'Lịch tái khám';
        const body = `${appointment.title} tại ${appointment.hospital} - ${appointment.location} lúc ${appointment.time}`;
        const date = new Date(appointment.date);
        scheduleLocalNotification(title, body, date, appointment.time);
      }
    });
  }, [appointments]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification nhận được:', notification);
    });
    return () => subscription.remove();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Lịch nhắc nhở</Text>
        <TouchableOpacity 
          style={styles.todayButton}
          onPress={scrollToToday}
        >
          <Text style={styles.todayButtonText}>Hôm nay</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'medication' && styles.activeTab]} 
          onPress={() => setActiveTab('medication')}
        >
          <Text style={[styles.tabText, activeTab === 'medication' && styles.activeTabText]}>Lịch uống thuốc</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'appointment' && styles.activeTab]}
          onPress={() => setActiveTab('appointment')}
        >
          <Text style={[styles.tabText, activeTab === 'appointment' && styles.activeTabText]}>Lịch tái khám</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.calendar}
        pagingEnabled
        onScroll={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const pageWidth = e.nativeEvent.layoutMeasurement.width;
          const newOffset = Math.round(offsetX / pageWidth);
          if (newOffset !== weekOffset) {
            setWeekOffset(newOffset);
          }
        }}
        scrollEventThrottle={16}
      >
        {generateDates().map((date, index) => (
          <TouchableOpacity 
            key={index}
            style={[
              styles.dateContainer,
              date.getDate() === selectedDate.getDate() && 
              date.getMonth() === selectedDate.getMonth() && 
              date.getFullYear() === selectedDate.getFullYear() && 
              styles.selectedDate
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={styles.dayText}>{getDayLabel(date)}</Text>
            <Text style={[
              styles.dateText,
              date.getDate() === selectedDate.getDate() && 
              date.getMonth() === selectedDate.getMonth() && 
              date.getFullYear() === selectedDate.getFullYear() && 
              styles.selectedDateText
            ]}>
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {activeTab === 'medication' ? (
        remindersForSelectedDate.length > 0 ? (
          <ScrollView style={styles.medicationList} contentContainerStyle={styles.medicationListContent}>
            {Object.entries(
              remindersForSelectedDate
                .sort((a, b) => {
                  const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
                  const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
                  return timeA - timeB;
                })
                .reduce((sections: { [key: string]: FlattenedReminder[] }, reminder) => {
                  const time = reminder.time;
                  if (!sections[time]) {
                    sections[time] = [];
                  }
                  sections[time].push(reminder);
                  return sections;
                }, {})
            ).map(([time, remindersForTime]) => (
              <View key={`time-${time}`} style={styles.timeSection}>
                <Text style={styles.timeHeader}>{time}</Text>
                {remindersForTime.map((reminder, index) => {
                  const statusDisplay = getStatusDisplay(reminder.status, reminder.taken);
                  const isCompleted = reminder.taken || reminder.status === 'on_time' || reminder.status === 'late';
                  const isSkipped = reminder.status === 'skipped';
                  
                  console.log(`=== RENDERING REMINDER FROM API - Time: ${reminder.time}, Status: ${reminder.status}, Taken: ${reminder.taken} ===`);
                  console.log('Status display:', statusDisplay);
                  
                  return (
                    <TouchableOpacity 
                      key={`${reminder._id}-${index}`}
                      style={[
                        styles.medicationItem,
                        { borderLeftColor: statusDisplay.color, borderLeftWidth: 4 }
                      ]}
                      onPress={() => {
                        setSelectedReminder(reminder);
                        setIsModalVisible(true);
                      }}
                    >
                      <View style={[
                        styles.medicationCircle,
                        { backgroundColor: statusDisplay.color }
                      ]} />
                      <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>
                          {reminder.medicationId?.name || 'Thuốc'} - {reminder.timeLabel}
                        </Text>
                        <Text style={styles.medicationDose}>
                          {reminder.medicationId?.form || reminder.medicationId?.dosage || ''}
                        </Text>
                        <Text style={styles.medicationNote}>
                          {reminder.note || 'Không có ghi chú'}
                        </Text>
                        <Text style={{
                          color: statusDisplay.color, 
                          fontSize: 12, 
                          fontWeight: '600', 
                          marginTop: 4
                        }}>
                          {statusDisplay.icon} {statusDisplay.text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Image
              source={require('../../assets/istockphoto-1014193944-170667a-removebg-preview.png')}
              style={styles.emptyStateImage}
            />
            <View style={styles.textContainer}>
              <Text style={styles.monitorText}>
                Theo dõi lịch uống thuốc của bạn
              </Text>
              <Text style={styles.subText}>
                Xem lịch trình hàng ngày và đánh dấu khi bạn đã uống thuốc
              </Text>
            </View>
          </View>
        )
      ) : (
        appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          const current = new Date(selectedDate);
          appointmentDate.setHours(0, 0, 0, 0);
          current.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === current.getTime();
        }).length > 0 ? (
          <ScrollView style={styles.medicationList} contentContainerStyle={styles.medicationListContent}>
            {Object.entries(
              appointments
                .filter(appointment => {
                  const appointmentDate = new Date(appointment.date);
                  const current = new Date(selectedDate);
                  appointmentDate.setHours(0, 0, 0, 0);
                  current.setHours(0, 0, 0, 0);
                  return appointmentDate.getTime() === current.getTime();
                })
                .sort((a, b) => {
                  const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
                  const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
                  return timeA - timeB;
                })
                .reduce((sections: { [key: string]: Appointment[] }, appointment) => {
                  const time = appointment.time;
                  if (!sections[time]) {
                    sections[time] = [];
                  }
                  sections[time].push(appointment);
                  return sections;
                }, {})
            ).map(([time, appointmentsForTime]) => (
              <View key={`appt-time-${time}`} style={styles.timeSection}>
                <Text style={styles.timeHeader}>{time}</Text>
                {appointmentsForTime.map((appointment, index) => (
                  <TouchableOpacity
                    key={`${appointment._id}-${index}`}
                    style={styles.medicationItem}
                    onPress={() => {
                      setSelectedReminder(appointment);
                      setIsModalVisible(true);
                    }}
                  >
                    <View style={styles.medicationCircle} />
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>
                        {appointment.title}
                      </Text>
                      <Text style={styles.medicationDose}>
                        {appointment.hospital} - {appointment.location}
                      </Text>
                      <Text style={styles.medicationNote}>
                        {appointment.notes || 'Không có ghi chú'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Image
              source={require('../../assets/istockphoto-1014193944-170667a-removebg-preview.png')}
              style={styles.emptyStateImage}
            />
            <View style={styles.textContainer}>
              <Text style={styles.monitorText}>
                Theo dõi lịch tái khám của bạn
              </Text>
              <Text style={styles.subText}>
                Xem và quản lý các lịch hẹn tái khám của bạn
              </Text>
            </View>
          </View>
        )
      )}

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            if (activeTab === 'medication') {
              navigation.navigate('MedicationsScreen', { token, userId });
            } else {
              navigation.navigate('AddAppointment', { token, userId });
            }
          }}
        >
          <Text style={styles.addButtonText}>
            {activeTab === 'medication'
              ? '+ Thêm lịch nhắc uống thuốc'
              : '+ Thêm lịch tái khám'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {'hospital' in (selectedReminder || {}) ? 'Chi tiết lịch tái khám' : 'Chi tiết thuốc'}
              </Text>
            </View>
            {selectedReminder && (
              <View style={styles.modalBody}>
                {'hospital' in selectedReminder ? (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tiêu đề:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.title}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Bệnh viện:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.hospital}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Địa điểm:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.location}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Thời gian:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ngày:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedReminder.date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ghi chú:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.notes || 'Không có ghi chú'}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tên thuốc:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.medicationId?.name || 'Không có tên'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Dạng thuốc:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.medicationId?.form || 'Không có'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Buổi:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.timeLabel}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Giờ:</Text>
                      <Text style={styles.detailValue}>{selectedReminder.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Từ ngày:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedReminder.startDate)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Đến ngày:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedReminder.endDate)}</Text>
                    </View>
                    {selectedReminder.note && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Ghi chú:</Text>
                        <Text style={styles.detailValue}>{selectedReminder.note}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
            <View style={styles.actionButtons}>
              {(() => {
                console.log('=== ACTION BUTTONS CONDITION CHECK ===');
                console.log('selectedReminder:', selectedReminder ? {
                  _id: selectedReminder._id,
                  taken: selectedReminder.taken,
                  status: selectedReminder.status,
                  isHospital: 'hospital' in selectedReminder
                } : null);
                console.log('isToday:', isToday(selectedDate));
                console.log('selectedDate:', selectedDate.toDateString());
                console.log('today:', new Date().toDateString());

                // Logic hiển thị nút action - CHỈ hiển thị khi:
                // 1. Không phải appointment
                // 2. Là ngày hôm nay  
                // 3. Chưa uống (taken = false)
                // 4. Không phải trạng thái đã hoàn thành
                const shouldShowActionButtons = selectedReminder && 
                  !('hospital' in selectedReminder) && 
                  isToday(selectedDate) && 
                  !selectedReminder.taken && 
                  selectedReminder.status !== 'on_time' && 
                  selectedReminder.status !== 'late' && 
                  selectedReminder.status !== 'skipped';

                console.log('=== SHOULD SHOW ACTION BUTTONS:', shouldShowActionButtons, '===');

                return shouldShowActionButtons;
              })() ? (
                <>
                  <TouchableOpacity 
                    onPress={() => handleReminderAction('take')}
                    style={styles.actionButton}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <MaterialIcons name="check-circle" size={28} color="#16A34A" />
                    </View>
                    <Text style={[styles.actionLabel, { color: '#16A34A' }]}>Đã uống</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleReminderAction('skip')}
                    style={styles.actionButton}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                      <MaterialIcons name="cancel" size={28} color="#DC2626" />
                    </View>
                    <Text style={[styles.actionLabel, { color: '#DC2626' }]}>Bỏ qua</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleReminderAction('snooze')}
                    style={styles.actionButton}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <MaterialIcons name="access-time" size={28} color="#D97706" />
                    </View>
                    <Text style={[styles.actionLabel, { color: '#D97706', fontSize: 12 }]}>Nhắc lại 5p</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={() => setIsModalVisible(false)} 
                    style={styles.actionButton}
                  >
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="close" size={28} color="#3B82F6" />
                    </View>
                    <Text style={[styles.actionLabel, { color: '#3B82F6' }]}>Đóng</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={async () => {
                      Alert.alert(
                        'Xác nhận xóa',
                        'Bạn có chắc chắn muốn xóa mục này?',
                        [
                          { text: 'Hủy', style: 'cancel' },
                          { 
                            text: 'Xóa', 
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                if (selectedReminder && 'hospital' in selectedReminder) {
                                  await AppointmentsService.deleteAppointment(selectedReminder._id, token);
                                  Alert.alert('Thành công', 'Đã xóa lịch tái khám');
                                  fetchAppointments();
                                } else if (selectedReminder) {
                                  const reminderId = selectedReminder._id.split('-')[0];
                                  await ReminderService.deleteReminder(reminderId, token);
                                  Alert.alert('Thành công', 'Đã xóa lịch nhắc uống thuốc');
                                  fetchReminders();
                                }
                                setIsModalVisible(false);
                              } catch (error) {
                                console.error('Error deleting:', error);
                                Alert.alert('Lỗi', 'Không thể xóa. Vui lòng thử lại');
                              }
                            }
                          }
                        ]
                      );
                    }}
                    style={styles.actionButton}
                  >
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="delete" size={28} color="#EF4444" />
                    </View>
                    <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Xóa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => {
                      setIsModalVisible(false);
                      if (selectedReminder && 'hospital' in selectedReminder) {
                        navigation.navigate('EditAppointment', { 
                          token, 
                          userId,
                          appointment: selectedReminder
                        });
                      } else if (selectedReminder) {
                        const reminderId = selectedReminder._id.split('-')[0];
                        navigation.navigate('EditReminder', { 
                          token, 
                          userId,
                          reminderId,
                          reminder: selectedReminder
                        });
                      }
                    }}
                    style={styles.actionButton}
                  > 
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="edit" size={28} color="#3B82F6" />
                    </View>
                    <Text style={[styles.actionLabel, { color: '#3B82F6' }]}>Sửa</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB', // Màu xanh rất nhạt
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconCircle: {
    backgroundColor: '#F6F8FB',
    borderRadius: 50,
    padding: 16,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  modalBody: {
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 100,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#F6F8FB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendar: {
    flexDirection: 'row',
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#F6F8FB',
    minHeight: 80,
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 2,
    width: 50,
    height: 70,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#B6D5FA',
  },
  selectedDate: {
    backgroundColor: '#00A3FF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  dayText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDateText: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F6F8FB',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#00A3FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#402727ff',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -500,
  },
  emptyStateImage: {
    width: 180,
    height: 135,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  monitorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  todayButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00A3FF',
  },
  todayButtonText: {
    color: '#00A3FF',
    fontSize: 14,
    fontWeight: '600',
  },
  medicationList: {
    flex: 1,
    paddingHorizontal: 16,
    top: -200,
  },
  medicationListContent: {
    paddingBottom: 20,
  },
  timeSection: {
    marginBottom: 20,
  },
  timeHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cdd9e7ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  medicationCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00A3FF',
    marginRight: 12,
  },
  medicationCircleTaken: {
    backgroundColor: '#4CAF50',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicationDose: {
    fontSize: 14,
    color: '#666',
  },
  medicationNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  takenStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F6F8FB',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#B6D5FA',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MedicationScheduleScreen;