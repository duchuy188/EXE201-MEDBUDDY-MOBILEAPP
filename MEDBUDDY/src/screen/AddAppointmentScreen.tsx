import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Switch, Button, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const { height: screenHeight } = Dimensions.get('window');
const ITEM_HEIGHT = 35;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const AddAppointmentScreen = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [selectedReminderNumber, setSelectedReminderNumber] = useState(1);
  const [selectedReminderUnit, setSelectedReminderUnit] = useState('Hours');

  const reminderNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const reminderUnits = ['Phút', 'Giờ', 'Ngày', 'Tuần'];

  const numberScrollRef = useRef(null);
  const unitScrollRef = useRef(null);

  const onDateTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || dateTime;
    setShowPicker(false);
    setDateTime(currentDate);
  };

  const showDatePicker = () => {
    setPickerMode('date');
    setShowPicker(true);
  };

  const showTimePicker = () => {
    setPickerMode('time');
    setShowPicker(true);
  };

  const WheelPicker = ({ data, selectedValue, onValueChange, scrollRef, style }) => {
    const handleScroll = (event) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      if (data[clampedIndex] !== selectedValue) {
        onValueChange(data[clampedIndex]);
      }
    };

    const scrollToIndex = (index) => {
      scrollRef?.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });
    };

    useEffect(() => {
      const index = data.indexOf(selectedValue);
      if (index !== -1) {
        setTimeout(() => scrollToIndex(index), 100);
      }
    }, [selectedValue, data]);

    return (
      <View style={[styles.wheelPickerContainer, style]}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT,
            paddingBottom: ITEM_HEIGHT,
          }}
        >
          {data.map((item, index) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                key={index}
                style={styles.wheelItem}
                onPress={() => {
                  onValueChange(item);
                  scrollToIndex(index);
                }}
              >
                <Text style={[
                  styles.wheelItemText,
                  isSelected && styles.selectedWheelItemText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Selection indicator lines */}
        <View style={styles.selectionIndicatorTop} />
        <View style={styles.selectionIndicatorBottom} />
      </View>
    );
  };

  const ReminderPickerModal = () => (
    <Modal
      visible={showReminderPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowReminderPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.reminderPickerContainer}>
         
          <View style={styles.pickersContainer}>
            <WheelPicker
              data={reminderNumbers}
              selectedValue={selectedReminderNumber}
              onValueChange={setSelectedReminderNumber}
              scrollRef={numberScrollRef}
              style={styles.numberPicker}
            />
            
            <WheelPicker
              data={reminderUnits}
              selectedValue={selectedReminderUnit}
              onValueChange={setSelectedReminderUnit}
              scrollRef={unitScrollRef}
              style={styles.unitPicker}
            />
          </View>
                    <View style={styles.pickerHeader}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowReminderPicker(false)}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.okButton}
              onPress={() => setShowReminderPicker(false)}
            >
              <Text style={styles.okText}>Đồng ý</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nhập tiêu đề lịch hẹn</Text>
      <TextInput style={styles.input} placeholder="Tiêu đề lịch hẹn" />

      <Text style={styles.label}>Bệnh viện</Text>
      <TextInput style={styles.input} placeholder="Chọn bệnh viện" />

      <Text style={styles.label}>Địa điểm</Text>
      <TextInput style={styles.input} placeholder="Nhập địa điểm" />

      <Text style={styles.label}>Ngày</Text>
      <TouchableOpacity style={styles.input} onPress={showDatePicker}>
        <Text>{dateTime.toLocaleDateString()}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Thời gian</Text>
      <TouchableOpacity style={styles.input} onPress={showTimePicker}>
        <Text>{`${dateTime.getHours()}:${String(dateTime.getMinutes()).padStart(2, '0')} ${dateTime.getHours() >= 12 ? 'chiều' : 'sáng'}`}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateTime}
          mode={pickerMode}
          is24Hour={true}
          display="spinner"
          onChange={onDateTimeChange}
        />
      )}

      <Text style={styles.label}>Nhắc nhở</Text>
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setShowReminderPicker(true)}
      >
        <Text>{selectedReminderNumber} {selectedReminderUnit}</Text>
      </TouchableOpacity>

      <ReminderPickerModal />

      <Text style={styles.label}>Ghi chú</Text>
      <TextInput style={styles.input} placeholder="Nhập ghi chú" />

      <TouchableOpacity style={styles.saveButton} onPress={() => {}}>
        <Text style={styles.saveButtonText}>Lưu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    height: 200,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#F7F7F7',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  cancelButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '400',
  },
  okButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  okText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  pickersContainer: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  wheelPickerContainer: {
    flex: 1,
    height: PICKER_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },
  selectedWheelItemText: {
    color: '#000000',
    fontWeight: '500',
  },
  numberPicker: {
    flex: 1,
  },
  unitPicker: {
    flex: 2,
  },
  selectionIndicatorTop: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: '#C6C6C8',
  },
  selectionIndicatorBottom: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: '#C6C6C8',
  },
});

export default AddAppointmentScreen;