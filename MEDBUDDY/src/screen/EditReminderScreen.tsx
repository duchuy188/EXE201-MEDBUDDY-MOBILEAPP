import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ReminderService from '../api/Reminders';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';

const voiceFiles: { [key: string]: any } = {
	banmai: require('../../voice/banmai.mp3'),
	thuminh: require('../../voice/thuminh.mp3'),
	giahuy: require('../../voice/giahuy.mp3'),
	lannhi: require('../../voice/lannhi.mp3'),
	leminh: require('../../voice/leminh.mp3'),
	myan: require('../../voice/myan.mp3'),
	linhsan: require('../../voice/linhsan.mp3'),
};

const EditReminderScreen = () => {
    const route = useRoute();
    const { token, userId, medication, deviceToken, reminder, reminderId } = route.params as any;

		// Debug log để xem cấu trúc dữ liệu
		console.log('EditReminderScreen - reminder data:', JSON.stringify(reminder, null, 2));
		console.log('EditReminderScreen - reminderId:', reminderId);

		// Lấy tên thuốc từ medication hoặc reminder.medicationId
		const [medicationName, setMedicationName] = useState(
			medication?.name || reminder?.medicationId?.name || 'Thuốc không xác định'
		);

		// Lấy thời gian nhắc từ reminder
		const getInitialSelectedTimes = () => {
			if (reminder?.times && Array.isArray(reminder.times)) {
				// Nếu có array times với format [{ time: 'Sáng' }, { time: 'Chiều' }]
				const timesMap: Record<string, string> = {};
				reminder.times.forEach((timeObj: any, index: number) => {
					if (reminder.repeatTimes && reminder.repeatTimes[index]) {
						const slot = timeObj.time === 'Sáng' ? 'morning' : 
									timeObj.time === 'Chiều' ? 'afternoon' : 'evening';
						timesMap[slot] = reminder.repeatTimes[index].time;
					}
				});
				return timesMap;
			}
			
			if (reminder?.time && reminder?.timeLabel) {
				// Nếu chỉ có 1 thời gian
				return {
					[reminder.timeLabel === 'Sáng' ? 'morning' : reminder.timeLabel === 'Chiều' ? 'afternoon' : 'evening']: reminder.time
				};
			}
			
			// Nếu có nhiều thời gian (ví dụ: reminder.selectedTimes)
			if (reminder?.selectedTimes) {
				return reminder.selectedTimes;
			}
			return {};
		};
		const [selectedTimes, setSelectedTimes] = useState(getInitialSelectedTimes());

		const [note, setNote] = useState(reminder?.note || '');
		const [reminderType, setReminderType] = useState(reminder?.reminderType || 'normal');
		const [voiceType, setVoiceType] = useState(reminder?.voice || 'banmai');
		const [time, setTime] = useState(new Date());
		const [startDate, setStartDate] = useState(reminder?.startDate ? new Date(reminder.startDate) : new Date());
		const [endDate, setEndDate] = useState(reminder?.endDate ? new Date(reminder.endDate) : new Date());
		const [showTimePicker, setShowTimePicker] = useState(false);
		const [currentTimeSlot, setCurrentTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
		const [showStartDatePicker, setShowStartDatePicker] = useState(false);
		const [showEndDatePicker, setShowEndDatePicker] = useState(false);

	const handleTimeConfirm = (date: Date) => {
		const formattedTime = date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
		setSelectedTimes((prev: Record<string, string>) => ({...prev, [currentTimeSlot]: formattedTime}));
		setShowTimePicker(false);
	};

	const handleStartDateConfirm = (date: Date) => {
		setStartDate(date);
		setShowStartDatePicker(false);
	};
	const handleEndDateConfirm = (date: Date) => {
		setEndDate(date);
		setShowEndDatePicker(false);
	};

	const playVoiceTest = async () => {
		try {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				staysActiveInBackground: false,
				playsInSilentModeIOS: true,
				shouldDuckAndroid: true,
				playThroughEarpieceAndroid: false,
			});
			const soundObject = new Audio.Sound();
			const soundFile = voiceFiles[voiceType];
			await soundObject.loadAsync(soundFile, { shouldPlay: true });
			await soundObject.playAsync();
			await soundObject.setVolumeAsync(1.0);
			soundObject.setOnPlaybackStatusUpdate(async (status) => {
				if (!status.isLoaded) return;
				if (status.isPlaying === false && status.positionMillis === status.durationMillis) {
					await soundObject.unloadAsync();
				}
			});
		} catch (error) {
			Alert.alert('Lỗi', 'Không thể phát âm thanh');
		}
	};

const handleUpdateReminder = async () => {
    if (!medicationName || Object.keys(selectedTimes).length === 0) {
        Alert.alert('Thông báo', 'Vui lòng nhập tên thuốc và chọn ít nhất một thời gian nhắc nhở');
        return;
    }
    try {
        // Tạo times array từ selectedTimes
        const timesArray = Object.entries(selectedTimes).map(([slotKey, time]) => {
            const slotLabel = slotKey === 'morning' ? 'Sáng' : slotKey === 'afternoon' ? 'Chiều' : 'Tối';
            return { time: slotLabel };
        });

        // Tạo repeatTimes array từ selectedTimes  
        const repeatTimesArray = Object.entries(selectedTimes).map(([slotKey, time]) => {
            return { time, taken: false };
        });

        const reminderData: any = {
            medicationId: reminder?.medicationId?._id || reminder?.medicationId,
            times: timesArray,
            repeatTimes: repeatTimesArray,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            reminderType,
            note,
            voice: reminderType === 'voice' ? voiceType : undefined,
            isActive: true
        };
        
        console.log('Updating reminder with data:', JSON.stringify(reminderData, null, 2));
        
        await ReminderService.updateReminder(reminderId, reminderData, token);
        Alert.alert('Thành công', 'Đã cập nhật lịch nhắc uống thuốc');
    } catch (error: any) {
        console.error('Error updating reminder:', error);
        Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật lịch nhắc');
    }
};
		const timeSlots = [
			{ key: 'morning', label: '🌅 Buổi sáng' },
			{ key: 'afternoon', label: '🌤️ Buổi chiều' },
			{ key: 'evening', label: '🌙 Buổi tối' },
		];

		// Determine which slots to show based on reminder.times labels or reminder.repeatTimes
		const allowedSlots = (() => {
			const labels = reminder?.times && Array.isArray(reminder.times)
				? reminder.times.map((t: any) => (t.time || '').toLowerCase())
				: null;
			if (labels && labels.length > 0) {
				return timeSlots.filter(slot => {
					const keyLabel = slot.key === 'morning' ? 'sáng' : slot.key === 'afternoon' ? 'chiều' : 'tối';
					return labels.includes(keyLabel);
				});
			}
			// fallback: if only repeatTimes exist, derive slots from clock hours
			const clocks = reminder?.repeatTimes && Array.isArray(reminder.repeatTimes)
				? reminder.repeatTimes.map((r: any) => r.time)
				: null;
			if (clocks && clocks.length > 0) {
				const slotKeys: string[] = clocks.map((t: string) => {
					const hour = parseInt((t || '0').split(':')[0] || '0', 10);
					if (hour < 12) return 'morning';
					if (hour < 18) return 'afternoon';
					return 'evening';
				});
				return timeSlots.filter(slot => slotKeys.includes(slot.key));
			}
			return timeSlots;
		})();
		const reminderTypeOptions = [
			{ label: 'Thông thường', value: 'normal' },
			{ label: 'Giọng nói', value: 'voice' },
		];
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
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.card}>
						<Text style={styles.title}>Chỉnh sửa lịch nhắc uống thuốc</Text>
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Tên thuốc</Text>
							<View style={[styles.input, { minHeight: 48, justifyContent: 'center' }]}> 
								<Text style={{ fontSize: 16, color: '#1E293B' }}>{medicationName}</Text>
							</View>
						</View>
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Ngày bắt đầu</Text>
							<TouchableOpacity style={styles.timeInput} onPress={() => setShowStartDatePicker(true)}>
								<Text style={styles.timeText}>{startDate.toLocaleDateString('vi-VN')}</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Ngày kết thúc</Text>
							<TouchableOpacity style={styles.timeInput} onPress={() => setShowEndDatePicker(true)}>
								<Text style={styles.timeText}>{endDate.toLocaleDateString('vi-VN')}</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Thời gian nhắc</Text>
							{allowedSlots.map(slot => (
								<View style={styles.timeSlotContainer} key={slot.key}>
									<Text style={styles.timeSlotLabel}>{slot.label}</Text>
									<View style={styles.timeRow}>
										<TouchableOpacity
											style={styles.timeInputFlex}
											onPress={() => {
												setCurrentTimeSlot(slot.key as 'morning' | 'afternoon' | 'evening');
												const existingTime = selectedTimes[slot.key as 'morning' | 'afternoon' | 'evening'];
												if (existingTime) {
													const [hours, minutes] = existingTime.split(':');
													const date = new Date();
													date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
													setTime(date);
												} else {
													setTime(new Date());
												}
												setShowTimePicker(true);
											}}
										>
											<Text style={styles.timeText}>{selectedTimes[slot.key] || 'Chọn thời gian'}</Text>
										</TouchableOpacity>
										{selectedTimes[slot.key] && (
											<TouchableOpacity
												style={styles.clearTimeButton}
												onPress={() => setSelectedTimes((prev: Record<string, string>) => {
													const newTimes = { ...prev };
													delete newTimes[slot.key];
													return newTimes;
												})}
											>
												<Text style={styles.clearTimeText}>✕</Text>
											</TouchableOpacity>
										)}
									</View>
								</View>
							))}
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
							<View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
								{reminderTypeOptions.map((option) => (
									<TouchableOpacity
										key={option.value}
										style={[styles.repeatOption, reminderType === option.value && styles.selectedRepeatOption]}
										onPress={() => setReminderType(option.value as 'normal' | 'voice')}
									>
										<Text style={[styles.repeatOptionText, reminderType === option.value && styles.selectedRepeatOptionText]}>
											{option.label}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
						{reminderType === 'voice' && (
							<View style={styles.inputGroup}>
								<Text style={styles.label}>Giọng đọc</Text>
								<View style={styles.pickerContainer}>
									<Picker
										selectedValue={voiceType}
										onValueChange={setVoiceType}
										style={styles.picker}
										dropdownIconColor="#1E293B"
									>
										<Picker.Item label="Ban Mai (Nữ miền Bắc)" value="banmai" />
										<Picker.Item label="Thu Minh (Nữ miền Bắc)" value="thuminh" />
										<Picker.Item label="Gia Huy (Nam miền Trung)" value="giahuy" />
										<Picker.Item label="Lan Nhi (Nữ miền Nam)" value="lannhi" />
										<Picker.Item label="Lê Minh (Nam miền Bắc)" value="leminh" />
										<Picker.Item label="Mỹ An (Nữ miền Trung)" value="myan" />
										<Picker.Item label="Linh San (Nữ miền Nam)" value="linhsan" />
									</Picker>
								</View>
								<TouchableOpacity style={styles.testVoiceButton} onPress={playVoiceTest}>
									<Text style={styles.testVoiceText}>🔊 Nghe thử giọng đọc</Text>
								</TouchableOpacity>
							</View>
						)}
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Lời nhắc (không bắt buộc)</Text>
							<TextInput
								style={styles.input}
								placeholder="Nhập lời nhắc"
								value={note}
								onChangeText={setNote}
								multiline
								placeholderTextColor="#B6D5FA"
							/>
						</View>
						<TouchableOpacity
							style={[styles.addButton, Object.keys(selectedTimes).length === 0 && styles.disabledButton]}
							onPress={handleUpdateReminder}
							disabled={Object.keys(selectedTimes).length === 0}
						>
							<Text style={styles.buttonText}>
								{Object.keys(selectedTimes).length > 0 
									? `Cập nhật ${Object.keys(selectedTimes).length} lịch nhắc` 
									: 'Cập nhật lịch nhắc'}
							</Text>
						</TouchableOpacity>
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
	repeatOption: {
		flex: 1,
		backgroundColor: '#EFF6FF',
		borderRadius: 10,
		padding: 12,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#B6D5FA',
	},
	selectedRepeatOption: {
		backgroundColor: '#3B82F6',
		borderColor: '#2563EB',
	},
	repeatOptionText: {
		color: '#2563EB',
		fontSize: 15,
		fontWeight: '600',
	},
	selectedRepeatOptionText: {
		color: '#fff',
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
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingBottom: 24,
	},
});

export default EditReminderScreen;
