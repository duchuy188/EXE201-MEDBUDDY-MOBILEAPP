import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

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
        <Text style={styles.title}>Lịch uống thuốc hôm nay</Text>
        <TouchableOpacity 
          style={styles.todayButton}
          onPress={scrollToToday}
        >
          <Text style={styles.todayButtonText}>Hôm nay</Text>
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
      
      <View style={styles.scheduleContainer}>
        <View style={styles.emptyStateContainer}>
          <Image
            source={require('../../assets/istockphoto-1014193944-170667a-removebg-preview.png')}
            style={styles.emptyStateImage}
          />
          <View style={styles.textContainer}>
            <Text style={styles.monitorText}>Theo dõi lịch uống thuốc của bạn</Text>
            <Text style={styles.subText}>Xem lịch trình hàng ngày và đánh dấu khi bạn đã uống thuốc</Text>
          </View>
        </View>
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddReminder', { token, userId })}
          >
            <Text style={styles.addButtonText}>+ Thêm lịch nhắc uống thuốc</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
    flex: 1,
    position: 'relative',
  },
  emptyStateContainer: {
    position: 'absolute',
    top: -400,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
});

export default MedicationScheduleScreen;
