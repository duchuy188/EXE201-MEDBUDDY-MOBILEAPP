import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, NativeSyntheticEvent, NativeScrollEvent, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import ReminderService, { Reminder } from '../api/Reminders';
import AppointmentsService from '../api/Appointments';

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
  time: string;
  startDate?: string;
  endDate?: string;
  repeat?: string;
  repeatDays?: number[];
  note?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  medicationId?: {
    _id: string;
    name?: string;
    dosage?: string;
    form?: string;
  };
}

const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const getDayLabel = (date: Date): string => {
  const day = date.getDay();
  return days[day === 0 ? 6 : day - 1]; // Chuyển đổi 0 (CN) thành index 6, các ngày khác trừ 1
};
const currentDate = new Date();

const MedicationScheduleScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  // @ts-ignore
  const { token, userId } = route.params;
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [activeTab, setActiveTab] = useState('medication'); // 'medication' or 'appointment'
  const [reminders, setReminders] = useState<DetailedReminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<DetailedReminder | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async () => {
    try {
      console.log('Fetching appointments with token:', token);
      const response = await AppointmentsService.getAppointments(token);
      console.log('Appointments response:', response);
      if (response && response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // Focus listener để load lại dữ liệu khi quay lại màn hình
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (activeTab === 'appointment') {
        fetchAppointments();
      }
    });

    return unsubscribe;
  }, [navigation, activeTab]);

  // Load dữ liệu khi chuyển tab hoặc component mount
  useEffect(() => {
    if (activeTab === 'appointment') {
      fetchAppointments();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        // First get all reminder IDs
        const remindersData = await ReminderService.getReminders(token);
        
        // Then fetch full details for each reminder
        const detailedReminders = await Promise.all(
          remindersData.map((reminder: any) => 
            ReminderService.getReminderById(reminder._id, token)
          )
        );
        
        console.log('Fetched reminders:', detailedReminders);
        setReminders(detailedReminders);
      } catch (error) {
        console.error('Error fetching reminders:', error);
      }
    };

    fetchReminders();
  }, [token]);

  const getWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    // Điều chỉnh về thứ 2 của tuần hiện tại
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // Thêm offset tuần
    monday.setDate(monday.getDate() + (weekOffset * 7));
    
    const dates = [];
    // Tạo mảng 7 ngày bắt đầu từ thứ 2
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
              date.getDate() === selectedDate.getDate() && styles.selectedDate
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={styles.dayText}>{getDayLabel(date)}</Text>
            <Text style={[
              styles.dateText,
              date.getDate() === selectedDate.getDate() && styles.selectedDateText
            ]}>
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {activeTab === 'medication' ? (
        // Lọc reminders cho ngày đã chọn
        reminders.filter(reminder => {
          if (reminder.repeat === 'daily') {
            const startDate = new Date(reminder.startDate || '');
            const endDate = new Date(reminder.endDate || '');
            const current = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            current.setHours(0, 0, 0, 0);
            return current >= startDate && current <= endDate;
          } else {
            const reminderDate = new Date(reminder.startDate || '');
            const current = new Date(selectedDate);
            reminderDate.setHours(0, 0, 0, 0);
            current.setHours(0, 0, 0, 0);
            return reminderDate.getTime() === current.getTime();
          }
        }).length > 0 ? (
          <ScrollView style={styles.medicationList} contentContainerStyle={styles.medicationListContent}>
            {Object.entries(
              reminders
                .filter(reminder => {
                console.log('Checking reminder:', reminder);
                console.log('Selected date:', selectedDate);

                // Đối với nhắc nhở hàng ngày
                if (reminder.repeat === 'daily') {
                  const startDate = new Date(reminder.startDate || '');
                  const endDate = new Date(reminder.endDate || '');
                  const current = new Date(selectedDate);
                  
                  // Reset time part để so sánh chỉ ngày tháng năm
                  startDate.setHours(0, 0, 0, 0);
                  endDate.setHours(0, 0, 0, 0);
                  current.setHours(0, 0, 0, 0);

                  const isInRange = current >= startDate && current <= endDate;
                  console.log('Daily reminder in range:', isInRange);
                  return isInRange;
                } 
                // Đối với nhắc nhở một lần
                else {
                  const reminderDate = new Date(reminder.startDate || '');
                  const current = new Date(selectedDate);
                  
                  // Reset time part để so sánh chỉ ngày tháng năm
                  reminderDate.setHours(0, 0, 0, 0);
                  current.setHours(0, 0, 0, 0);

                  const isSameDay = reminderDate.getTime() === current.getTime();
                  console.log('One-time reminder matches:', isSameDay);
                  return isSameDay;
                }
              })
              .sort((a, b) => {
                const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
                const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
                return timeA - timeB;
              })
              .reduce((sections: { [key: string]: DetailedReminder[] }, reminder) => {
                const time = reminder.time;
                if (!sections[time]) {
                  sections[time] = [];
                }
                sections[time].push(reminder);
                return sections;
              }, {})
          ).map(([time, remindersForTime]) => (
            <View key={time} style={styles.timeSection}>
              <Text style={styles.timeHeader}>{time}</Text>
              {remindersForTime.map((reminder, index) => (
                <TouchableOpacity 
                  key={reminder._id || index} 
                  style={styles.medicationItem}
                  onPress={() => {
                    setSelectedReminder(reminder);
                    setIsModalVisible(true);
                  }}
                >
                  <View style={styles.medicationCircle} />
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>
                      {reminder.medicationId?.name || 'Thuốc'}
                    </Text>
                    <Text style={styles.medicationDose}>
                      {reminder.medicationId?.dosage}
                    </Text>
                    <Text style={styles.medicationNote}>
                      {reminder.note || 'Không có ghi chú'}
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
              Theo dõi lịch uống thuốc của bạn
            </Text>
            <Text style={styles.subText}>
              Xem lịch trình hàng ngày và đánh dấu khi bạn đã uống thuốc
            </Text>
          </View>
        </View>
      )) : (
        // Lọc appointments cho ngày đã chọn
        appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          const current = new Date(selectedDate);
          appointmentDate.setHours(0, 0, 0, 0);
          current.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === current.getTime();
        }).length > 0 ? (
          <ScrollView style={styles.medicationList} contentContainerStyle={styles.medicationListContent}>
            {appointments
              .filter(appointment => {
                const appointmentDate = new Date(appointment.date);
                const current = new Date(selectedDate);
                
                // Reset time part để so sánh chỉ ngày tháng năm
                appointmentDate.setHours(0, 0, 0, 0);
                current.setHours(0, 0, 0, 0);

                return appointmentDate.getTime() === current.getTime();
              })
              .sort((a, b) => {
                const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
                const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
                return timeA - timeB;
              })
              .map((appointment) => (
                <View key={appointment._id} style={styles.medicationItem}>
                  <View style={styles.medicationCircle} />
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>
                      {appointment.title}
                    </Text>
                    <Text style={styles.medicationDose}>
                      {appointment.hospital} - {appointment.location}
                    </Text>
                    <Text style={styles.medicationDose}>
                      {appointment.time}
                    </Text>
                    <Text style={styles.medicationNote}>
                      {appointment.notes || 'Không có ghi chú'}
                    </Text>
                  </View>
                </View>
              ))
            }
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
              console.log('Navigating to MedicationsScreen with:', { token, userId });
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết thuốc</Text>
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedReminder && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tên thuốc:</Text>
                  <Text style={styles.detailValue}>{selectedReminder.medicationId?.name || 'Không có tên'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Liều lượng:</Text>
                  <Text style={styles.detailValue}>{selectedReminder.medicationId?.dosage || 'Không có'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dạng thuốc:</Text>
                  <Text style={styles.detailValue}>{selectedReminder.medicationId?.form || 'Không có'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thời gian:</Text>
                  <Text style={styles.detailValue}>{selectedReminder.time}</Text>
                </View>
                {selectedReminder.repeat && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lặp lại:</Text>
                    <Text style={styles.detailValue}>
                      {selectedReminder.repeat === 'daily' ? 'Hàng ngày' : 'Một lần'}
                    </Text>
                  </View>
                )}
                {selectedReminder.note && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ghi chú:</Text>
                    <Text style={styles.detailValue}>{selectedReminder.note}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
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
  calendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendar: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 2,
    width: 50,
    height: 70,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
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
  scheduleContainer: {
    // Removed - not needed
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
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
    color: '#fff',
  },
  emptyStateContainer: {
    top: -120,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
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
  // Medication list styles
  medicationList: {
    paddingHorizontal: 16,
  },
  medicationListContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  timeSection: {
    marginBottom: 24,
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
    backgroundColor: '#f8f8f8',
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
  // Bottom button styles
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#00A3FF',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MedicationScheduleScreen;