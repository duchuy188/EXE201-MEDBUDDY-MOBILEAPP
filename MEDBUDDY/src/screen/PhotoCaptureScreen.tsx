import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { medicationServiceWithOCR } from '../api/Medication';
import OrcService from '../api/orc';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

const PhotoCaptureScreen: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [editableMedicines, setEditableMedicines] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const route = useRoute();
  const navigation = useNavigation();

  React.useEffect(() => {
    // Ưu tiên lấy token từ route.params, fallback AsyncStorage nếu không có
    const getToken = async () => {
      // @ts-ignore
      const paramToken = route.params?.token;
      if (paramToken) {
        setToken(paramToken);
      } else {
        // fallback: try AsyncStorage (silent), but don't block if missing
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const storedToken = await AsyncStorage.getItem('token');
          if (storedToken) setToken(storedToken);
        } catch (e) {
          // ignore
        }
      }
    };
    getToken();
  }, [route.params]);

  // Function to parse times from rawText
  const parseTimesFromText = (rawText: string, medicineName: string) => {
    const times: any[] = [];
    
    try {
      console.log(` [PARSE] Phân tích rawText cho "${medicineName}"`);
      
      // Tìm pattern "X lần" trong text
      const timesPattern = /(\d+)\s*l[àa]n/gi;
      const matches = rawText.match(timesPattern);
      
      if (matches) {
        const frequency = parseInt(matches[0].replace(/[^\d]/g, ''));
        console.log(` [PARSE] Tìm thấy tần suất: ${frequency} lần/ngày`);
        
        // Tạo times array dựa trên tần suất
        if (frequency === 1) {
          times.push({ time: 'Sáng', dosage: '1 lần' });
        } else if (frequency === 2) {
          times.push({ time: 'Sáng', dosage: '1 lần' });
          times.push({ time: 'Tối', dosage: '1 lần' });
        } else if (frequency === 3) {
          times.push({ time: 'Sáng', dosage: '1 lần' });
          times.push({ time: 'Chiều', dosage: '1 lần' });
          times.push({ time: 'Tối', dosage: '1 lần' });
        } else if (frequency >= 4) {
          times.push({ time: 'Sáng', dosage: '1 lần' });
          times.push({ time: 'Chiều', dosage: '1 lần' });
          times.push({ time: 'Tối', dosage: '1 lần' });
        }
      }
      
      // Tìm pattern liều lượng cụ thể như "1 viên", "1 giọt"
      const dosagePattern = /(\d+)\s*(viên|giọt|ml|g)/gi;
      const dosageMatches = rawText.match(dosagePattern);
      
      if (dosageMatches && times.length > 0) {
        const dosage = dosageMatches[0];
        console.log(`💊 [PARSE] Tìm thấy liều lượng: ${dosage}`);
        times.forEach(time => {
          time.dosage = dosage;
        });
      }
      
      console.log(` [PARSE] Kết quả phân tích cho "${medicineName}":`, times);
      
    } catch (error) {
      console.error(' [PARSE] Lỗi khi phân tích thời gian:', error);
    }
    
    return times;
  };

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    try {
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        setIsProcessing(false);
        return;
      }
      const fileName = uri.split('/').pop() || 'image.jpg';
      const image = {
        uri: uri,
        name: fileName,
        type: 'image/jpeg',
      };
      console.log(' [OCR] Đang xử lý ảnh:', fileName);
      const ocrResult = await OrcService.recognizePrescription(image, token);
      console.log(' [OCR] Kết quả OCR nhận được:', JSON.stringify(ocrResult, null, 2));
      
      setExtractedData(ocrResult);
      if (ocrResult?.medicines) {
        console.log(' [OCR] Danh sách thuốc trước khi edit:', JSON.stringify(ocrResult.medicines, null, 2));
        
        // Auto-parse times from rawText if times array is empty
        const enhancedMedicines = ocrResult.medicines.map((med: any) => {
          if (!med.times || med.times.length === 0) {
            const parsedTimes = parseTimesFromText(ocrResult.rawText, med.name);
            if (parsedTimes.length > 0) {
              console.log(` [AUTO-PARSE] Tự động phân tích thời gian cho "${med.name}":`, parsedTimes);
              return { ...med, times: parsedTimes };
            }
          }
          return { ...med };
        });
        
        setEditableMedicines(enhancedMedicines);
      } else {
        console.log(' [OCR] Không tìm thấy medicines trong kết quả');
      }
    } catch (error: any) {
      // Thử lấy thông tin lỗi từ nhiều trường hợp khác nhau
      const errObj = error?.response?.data || error?.response || error || {};
      console.log('OCR ERROR:', errObj);

      if (
        errObj?.error === 'FEATURE_ACCESS_DENIED' ||
        errObj?.message?.includes('không có quyền sử dụng') ||
        errObj?.requiredFeature === 'Phân tích đơn thuốc' ||
        (error?.response?.status === 403)
      ) {
        // show upgrade modal instead of Alert so user can navigate to subscription
        setUpgradeMessage(errObj?.message || 'Vui lòng mua gói để sử dụng tính năng này.');
        setUpgradeModalVisible(true);
      } else {
        Alert.alert('Lỗi', 'Không thể nhận diện ảnh. Vui lòng thử lại.');
      }
    }
    setIsProcessing(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Bạn cần cấp quyền camera để sử dụng chức năng này.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      setCapturedImage(uri);
      await processImage(uri);
    }
  };

  const chooseFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Bạn cần cấp quyền truy cập thư viện ảnh để sử dụng chức năng này.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      setCapturedImage(uri);
      await processImage(uri);
    }
  };

  // Function to normalize time values to match backend enum
  const normalizeTimeValue = (time: string): 'Sáng' | 'Chiều' | 'Tối' => {
    const lowerTime = time.toLowerCase().trim();
    console.log(`🔄 [NORMALIZE] Chuyển đổi time: "${time}" -> "${lowerTime}"`);
    
    switch (lowerTime) {
      case 'sáng':
      case 'sang':
      case 'morning':
        console.log(` [NORMALIZE] "${time}" -> "Sáng"`);
        return 'Sáng';
      case 'chiều':
      case 'chieu':
      case 'afternoon':
        console.log(` [NORMALIZE] "${time}" -> "Chiều"`);
        return 'Chiều';
      case 'tối':
      case 'toi':
      case 'evening':
      case 'night':
        console.log(` [NORMALIZE] "${time}" -> "Tối"`);
        return 'Tối';
      default:
        console.log(` [NORMALIZE] Không nhận dạng được "${time}", dùng default "Sáng"`);
        return 'Sáng'; // default fallback
    }
  };

  // Function to normalize medicines data before saving
  const normalizeMedicinesData = (medicines: any[]) => {
    console.log(' [NORMALIZE] Dữ liệu medicines trước khi chuẩn hóa:', JSON.stringify(medicines, null, 2));
    
    return medicines.map((med, index) => {
      console.log(` [NORMALIZE] Xử lý thuốc ${index + 1}: ${med.name}`);
      
      // Extract số lượng từ string quantity
      const quantityNumber = med.quantity ? parseInt(med.quantity.match(/\d+/)?.[0] || '0') : 0;
      console.log(` [NORMALIZE] Thuốc "${med.name}": quantity="${med.quantity}" -> totalQuantity=${quantityNumber}`);
      
      const normalizedMed = {
        ...med,
        totalQuantity: quantityNumber,
        remainingQuantity: quantityNumber, // Mới thêm thì remaining = total
        lowStockThreshold: Math.max(5, Math.floor(quantityNumber * 0.2)), // 20% của tổng số hoặc tối thiểu 5
        times: Array.isArray(med.times) ? med.times.map((t: any, timeIndex: number) => {
          console.log(` [NORMALIZE] Xử lý time ${timeIndex + 1}:`, t);
          
          if (typeof t === 'string') {
            console.log(` [NORMALIZE] Time là string: "${t}"`);
            return t;
          }
          if (typeof t === 'object' && t !== null && t.time) {
            const normalizedTime = {
              time: normalizeTimeValue(t.time),
              dosage: t.dosage || ''
            };
            console.log(` [NORMALIZE] Time là object:`, t, '-> normalized:', normalizedTime);
            return normalizedTime;
          }
          console.log(` [NORMALIZE] Time không hợp lệ:`, t);
          return t;
        }) : []
      };
      
      console.log(` [NORMALIZE] Thuốc ${index + 1} sau khi chuẩn hóa:`, JSON.stringify(normalizedMed, null, 2));
      return normalizedMed;
    });
  };

  const handleAddToInventory = async () => {
    try {
      console.log(' [SAVE] Bắt đầu lưu thuốc vào kho...');
      
      if (!token) {
        console.log('❌ [SAVE] Không tìm thấy token');
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực.');
        return;
      }
      
      // @ts-ignore
      const userId = route.params?.userId || '';
      console.log(' [SAVE] User ID:', userId);
      
      // Giả sử bạn đã có biến cloudinaryUrl là link ảnh trên Cloudinary
      const cloudinaryUrl = extractedData?.imageUrl || '';
      console.log(' [SAVE] Image URL:', cloudinaryUrl);
      
      console.log(' [SAVE] editableMedicines trước khi normalize:', JSON.stringify(editableMedicines, null, 2));
      
      // Normalize medicines data before sending
      const normalizedMedicines = normalizeMedicinesData(editableMedicines);
      
      const data = {
        userId,
        medicines: normalizedMedicines,
        imageUrl: cloudinaryUrl,
        rawText: extractedData?.rawText || '',
      };
      
      console.log(' [SAVE] Dữ liệu sẽ gửi lên server:', JSON.stringify(data, null, 2));
      
      const result = await medicationServiceWithOCR.saveMedicationsFromOCR(data, token);
      console.log(' [SAVE] Lưu thành công! Kết quả từ server:', JSON.stringify(result, null, 2));
      
      // Check if server ignored totalQuantity and remainingQuantity
      if (result && Array.isArray(result)) {
        result.forEach((savedMed: any, index: number) => {
          const originalMed = normalizedMedicines[index];
          if (savedMed.totalQuantity !== originalMed?.totalQuantity) {
            console.log(` [SAVE] SERVER BỎ QUA totalQuantity! Gửi: ${originalMed?.totalQuantity}, Nhận: ${savedMed.totalQuantity}`);
            console.log(` [SAVE] Backend cần được sửa để xử lý totalQuantity và remainingQuantity từ request!`);
          }
        });
      }
      
      Alert.alert('Thêm vào kho thành công!', 'Thông tin thuốc đã được thêm vào kho.');
      setCapturedImage(null);
      setExtractedData(null);
      setEditableMedicines([]);
    } catch (error: any) {
      console.error(' [SAVE] Lỗi khi lưu thuốc:', error);
      console.error(' [SAVE] Error response:', error?.response?.data);
      console.error(' [SAVE] Error message:', error?.message);
      console.error('[SAVE] Full error object:', JSON.stringify(error, null, 2));
      
      Alert.alert('Lỗi', `Không thể lưu thuốc vào kho. ${error?.response?.data?.message || error?.message || 'Vui lòng thử lại.'}`);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <View style={{marginTop: 32}}>
        <Text style={styles.title}>
          <FontAwesome5 name="camera" size={20} color="#3B82F6" /> Chụp hóa đơn thuốc
        </Text>
      </View>
      {/* Upgrade modal shown when server returns 403 asking to buy plan */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.patientModal, { maxHeight: 240 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Không thể nhận diện ảnh</Text>
              <TouchableOpacity onPress={() => setUpgradeModalVisible(false)}>
                <MaterialIcons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingTop: 8 }}>
              <Text style={{ color: '#374151', fontSize: 15, lineHeight: 22 }}>
                {upgradeMessage || 'Vui lòng mua gói để sử dụng tính năng này.'}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setUpgradeModalVisible(false)}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 10 }}
                >
                  <Text style={{ color: '#6B7280' }}>Đóng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setUpgradeModalVisible(false);
                    // @ts-ignore
                    navigation.navigate('PackageScreen');
                  }}
                  style={{ backgroundColor: '#4A7BA7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Mua gói</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      {!capturedImage ? (
        <View>
          <View style={styles.card}>
            <Feather name="camera" size={48} color="#B6D5FA" style={{alignSelf: 'center'}} />
            <Text style={styles.desc}>Chụp ảnh hóa đơn thuốc để AI tự động nhận diện và thêm vào kho</Text>
            <TouchableOpacity style={styles.btn} onPress={pickImage}>
              <Feather name="camera" size={18} color="#2563EB" />
              <Text style={styles.btnText}>Chụp ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={chooseFromLibrary}>
              <Feather name="image" size={18} color="#3B82F6" />
              <Text style={[styles.btnText, {color: '#2563EB'}]}>Chọn từ thư viện</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Mẹo chụp ảnh tốt:</Text>
            <Text style={styles.tip}>• Đảm bảo ánh sáng đủ sáng</Text>
            <Text style={styles.tip}>• Hóa đơn phẳng, không bị cong</Text>
            <Text style={styles.tip}>• Chữ rõ ràng, không bị mờ</Text>
            <Text style={styles.tip}>• Chụp toàn bộ hóa đơn</Text>
          </View>
        </View>
      ) : (
        <View>
          <Image source={{ uri: capturedImage }} style={styles.image} />
          {isProcessing && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={{color: '#fff', marginTop: 8}}>AI đang phân tích hóa đơn...</Text>
            </View>
          )}
          {extractedData && (
            <View style={styles.resultCard}>
              <Text style={styles.successTitle}>✅ Nhận diện thành công!</Text>
              <Text style={styles.resultText}>Danh sách thuốc (có thể sửa):</Text>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={80}
                style={{flex: 0}}
              >
                <ScrollView
                  style={{maxHeight: 220}}
                  contentContainerStyle={{paddingBottom: 100}}
                  keyboardShouldPersistTaps="handled"
                >
                  {editableMedicines.map((med: any, idx: number) => (
                    <View key={idx} style={styles.medicineItem}>
                      {/* Nút xóa thuốc */}
                      <TouchableOpacity
                        style={{position: 'absolute', top: 8, right: 8, zIndex: 1}}
                        onPress={() => {
                          const newMeds = editableMedicines.filter((_, i) => i !== idx);
                          setEditableMedicines(newMeds);
                        }}
                      >
                        <Feather name="trash-2" size={20} color="#EF4444" />
                      </TouchableOpacity>
                      {/* Các trường thông tin thuốc */}
                      <TextInput
                        style={[styles.input, {fontWeight: 'bold', marginBottom: 4}]}
                        value={med.name}
                        onChangeText={text => {
                          const newMeds = [...editableMedicines];
                          newMeds[idx].name = text;
                          setEditableMedicines(newMeds);
                        }}
                        placeholder="Tên thuốc"
                      />
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <TextInput
                          style={[styles.input, {flex: 1}]}
                          value={med.quantity}
                          onChangeText={text => {
                            // Chỉ cho nhập số
                            if (/^\d*$/.test(text)) {
                              const newMeds = [...editableMedicines];
                              newMeds[idx].quantity = text;
                              setEditableMedicines(newMeds);
                            }
                          }}
                          placeholder="Số lượng"
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={[styles.input, {width: 80, marginLeft: 8, justifyContent: 'center'}]}
                          onPress={() => {
                            const newMeds = [...editableMedicines];
                            newMeds[idx].showUnitPicker = !newMeds[idx].showUnitPicker;
                            setEditableMedicines(newMeds);
                          }}
                        >
                          <Text style={{color: '#64748B'}}>{med.form || 'Đơn vị'}</Text>
                          <Feather name="chevron-down" size={18} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                      {med.showUnitPicker && (
                        <View style={{backgroundColor: '#F0F6FF', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#B6D5FA'}}>
                          {['viên', 'lọ', 'ống', 'gói'].map(unit => (
                            <TouchableOpacity
                              key={unit}
                              style={{padding: 10}}
                              onPress={() => {
                                const newMeds = [...editableMedicines];
                                newMeds[idx].form = unit;
                                newMeds[idx].showUnitPicker = false;
                                setEditableMedicines(newMeds);
                              }}
                            >
                              <Text style={{color: med.form === unit ? '#2563EB' : '#1E293B'}}>{unit}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      <TextInput
                        style={styles.input}
                        value={med.note || ''}
                        onChangeText={text => {
                          const newMeds = [...editableMedicines];
                          newMeds[idx].note = text;
                          setEditableMedicines(newMeds);
                        }}
                        placeholder="Ghi chú"
                      />
                      {/* Nếu có times, hiển thị thêm */}
                      {Array.isArray(med.times) && med.times.length > 0 && (
                        <View style={{marginTop: 6}}>
                          <Text style={{fontWeight: 'bold', color: '#2563EB'}}>Thời gian uống:</Text>
                          {med.times.map((t: any, i: number) => (
                            <Text key={i} style={{color: '#64748B', marginLeft: 8}}>
                              • {typeof t === 'string' ? t : (typeof t === 'object' && t !== null ? `${t.time || ''} (${t.dosage || ''})` : String(t))}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </KeyboardAvoidingView>
              <View style={{flexDirection: 'row', marginTop: 12}}>
                <TouchableOpacity style={[styles.btn, {flex: 1}]} onPress={() => {
                  setExtractedData({ ...extractedData, medicines: editableMedicines });
                  handleAddToInventory();
                }}>
                  <Feather name="check-circle" size={18} color="#2563EB" />
                  <Text style={styles.btnText}>Thêm vào kho</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutline, {flex: 1, marginLeft: 8}]} onPress={handleRetake}>
                  <Feather name="camera" size={18} color="#2563EB" />
                  <Text style={[styles.btnText, {color: '#2563EB'}]}>Chụp lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {!isProcessing && !extractedData && (
            <TouchableOpacity style={[styles.btn, styles.btnOutline, {marginTop: 12}]} onPress={handleRetake}>
              <Feather name="camera" size={18} color="#3B82F6" />
              <Text style={[styles.btnText, {color: '#3B82F6'}]}>Chụp lại</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  container: { flex: 1, backgroundColor: '#F6F8FB', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 18, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 22, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#B6D5FA' },
  desc: { color: '#64748B', fontSize: 15, textAlign: 'center', marginVertical: 12 },
  btn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#B6D5FA', 
    borderRadius: 12, 
    paddingVertical: 16, 
    paddingHorizontal: 24,
    marginTop: 10,
    width: '100%',
    minHeight: 52
  },
  btnText: { 
    color: '#2563EB', 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 8 
  },
  btnOutline: { 
    backgroundColor: '#F0F6FF', 
    borderWidth: 1, 
    borderColor: '#B6D5FA' 
  },
  tipCard: { backgroundColor: '#E0F2FE', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#B6D5FA' },
  tipTitle: { fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  tip: { color: '#3B82F6', fontSize: 14 },
  image: { width: '100%', height: 180, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#B6D5FA' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  resultCard: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#BBF7D0', marginTop: 10 },
  successTitle: { fontWeight: 'bold', color: '#16a34a', marginBottom: 8, fontSize: 16 },
  resultText: { color: '#1E293B', fontSize: 14, marginBottom: 4 },
  medicineItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    shadowColor: '#F0F6FF',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  patientModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  }
});

export default PhotoCaptureScreen;