import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import RelativePatientService from '../api/RelativePatient';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

interface Patient {
  _id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

const PhotoCaptureRelative: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [editableMedicines, setEditableMedicines] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>(''); // fallback id (params or manual)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);

  // NEW: upgrade modal state
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    const getParams = async () => {
      // @ts-ignore
      const paramToken = route.params?.token;
      // @ts-ignore
      const paramUserId = route.params?.userId || route.params?.patientId;
      if (paramToken) setToken(paramToken);
      if (paramUserId) setPatientId(paramUserId);
    };
    getParams();
  }, [route.params]);

  // load patients list for modal (when token available)
  useEffect(() => {
    const loadPatients = async () => {
      if (!token) return;
      try {
        const res = await RelativePatientService.getPatientsOfRelative(token);
        // backend may return { patients: [...] } or array directly
        const raw = res?.patients || res?.data || res || [];
        const arr = Array.isArray(raw) ? raw : [];

        // Normalize to shape: { _id, fullName, email, phone, dateOfBirth }
        const normalized = arr.map((item: any) => {
          // item may be { patient: {...}, permissions: [...] } or direct patient object
          const p = item?.patient || item;
          return {
            _id: p?._id || p?.id || '',
            fullName: p?.fullName || p?.full_name || p?.name || '',
            email: p?.email || '',
            phone: p?.phone || p?.phoneNumber || p?.phone_number || '',
            dateOfBirth: p?.dateOfBirth || p?.dob || p?.date_of_birth || '',
            // keep original if needed
            raw: item,
          };
        });

        setPatients(normalized);
      } catch (e) {
        console.log('Load patients error', e);
      }
    };
    loadPatients();
  }, [token]);

  const processImage = async (uri: string, attempt = 0) => {
    const MAX_RETRY = 3;
    setIsProcessing(true);

    try {
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        return;
      }

      const targetPatientId = selectedPatient?._id || patientId;
      if (!targetPatientId) {
        if (patients.length) {
          setShowPatientSelector(true);
          Alert.alert('Vui lòng chọn người bệnh', 'Chọn người bệnh trước khi gửi ảnh OCR.');
        } else {
          Alert.alert('Lỗi', 'Vui lòng chọn / nhập userId (patientId) trước khi gửi ảnh OCR.');
        }
        return;
      }

      const fileName = uri.split('/').pop() || 'image.jpg';

      // Append file object directly (uri,name,type) - works reliably on Expo / RN Android
      const formData = new FormData();
      // @ts-ignore - React Native FormData accepts { uri, name, type }
      formData.append('image', { uri, name: fileName, type: 'image/jpeg' } as any);
      
      console.log('Uploading OCR image for patient:', targetPatientId, 'fileName:', fileName);

      const ocrResult = await RelativePatientService.createMedicationsFromOcrImageForPatient(targetPatientId, formData, token);
      console.log('OCR result:', ocrResult);

      // Normalize response: backend may return { data: [...] } or { medicines: [...] } or array directly
      setExtractedData(ocrResult);

      const items =
        Array.isArray(ocrResult?.data) ? ocrResult.data
        : Array.isArray(ocrResult?.medicines) ? ocrResult.medicines
        : Array.isArray(ocrResult) ? ocrResult
        : [];

      const normalizedMeds = items.map((m: any) => ({
        name: m.name || m.title || '',
        form: m.form || m.unit || '',
        quantity: m.quantity || m.qty || '',
        note: m.note || '',
        times: Array.isArray(m.times) ? m.times : [],
        // keep server ids if needed
        _id: m._id || m.id || undefined,
      }));

      if (normalizedMeds.length) {
        setEditableMedicines(normalizedMeds);
      } else {
        // no items found => clear list (so UI won't show empty block unexpectedly)
        setEditableMedicines([]);
      }
      return;
    } catch (error: any) {
      console.log('OCR ERROR full:', error?.response ?? error?.message ?? error);

      const status = error?.response?.status;
      const serverMsg = (error?.response?.data?.message || error?.response?.data || error?.message || '').toString();

      // Detect network error
      const isNetworkError = error?.message === 'Network Error' || error?.message === 'Network request failed' || error?.code === 'ERR_NETWORK' || (!error?.response && /network/i.test(error?.message || ''));

      if (isNetworkError && attempt < MAX_RETRY) {
        const delay = 1000 * (attempt + 1); // exponential-ish backoff
        console.log(`Network error, retrying in ${delay}ms (attempt ${attempt + 1})`);
        setTimeout(() => processImage(uri, attempt + 1), delay);
        return;
      }

      if (isNetworkError) {
        Alert.alert('Lỗi mạng', 'Không thể kết nối tới server. Vui lòng kiểm tra mạng và thử lại.', [
          { text: 'Thử lại', onPress: () => processImage(uri, 0) },
          { text: 'Đóng', style: 'cancel' },
        ]);
        return;
      }

      if (status === 403 || /không có quyền truy cập|không có quyền/i.test(serverMsg)) {
        setUpgradeMessage(serverMsg || 'Bạn không có quyền truy cập dữ liệu người này');
        setUpgradeModalVisible(true);
        return;
      }

      if (/phân tích đơn thuốc|mua gói|vui lòng mua gói/i.test(serverMsg)) {
        Alert.alert('Tính năng bị giới hạn', serverMsg || 'Vui lòng nâng cấp gói để sử dụng tính năng này.', [
          { text: 'Mua gói', onPress: () => navigation.navigate('PackageScreen') },
          { text: 'Đóng', style: 'cancel' },
        ]);
        return;
      }

      Alert.alert('Lỗi', 'Không thể nhận diện ảnh. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Bạn cần cấp quyền camera để sử dụng chức năng này.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      setCapturedImage(uri);
      await processImage(uri);
    }
  };

  const handleAddToInventory = async () => {
    try {
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực.');
        return;
      }
      const userIdToUse = selectedPatient?._id || route.params?.userId || patientId || '';
      const payload = {
        medicines: editableMedicines,
        imageUrl: extractedData?.imageUrl || '',
        rawText: extractedData?.rawText || '',
      };
      // Save medicines for the chosen patient via relative-patient API
      await RelativePatientService.createMedicationsFromOcrForPatient(userIdToUse, payload, token);
      Alert.alert('Thêm vào kho thành công!', 'Thông tin thuốc đã được thêm vào kho.');
      setCapturedImage(null);
      setExtractedData(null);
      setEditableMedicines([]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu thuốc vào kho. Vui lòng thử lại.');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setIsProcessing(false);
  };

  // secondary label for selected patient (don't show raw id)
  const selectedPatientSecondary = selectedPatient
    ? (selectedPatient.email || selectedPatient.phone || (selectedPatient.dateOfBirth ? `Sinh: ${new Date(selectedPatient.dateOfBirth).toLocaleDateString('vi-VN')}` : ''))
    : 'Nhấn để chọn người bệnh';

  return (
    <View style={styles.container}>
      <View style={{ marginTop: 32 }}>
        <Text style={styles.title}>
          <FontAwesome5 name="camera" size={20} color="#3B82F6" /> Chụp hóa đơn thuốc
        </Text>
      </View>

      {/* Patient selector UI like AddReminderRelative */}
      <View style={{ marginHorizontal: 4, marginBottom: 10 }}>
        <Text style={{ color: '#64748B', marginBottom: 6 }}>Người bệnh</Text>
        <TouchableOpacity
          style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }]}
          onPress={() => setShowPatientSelector(true)}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: '#1E293B' }}>
              {selectedPatient?.fullName || 'Chọn người bệnh'}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              {selectedPatientSecondary}
            </Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {!capturedImage ? (
        <View>
          <View style={styles.card}>
            <Feather name="camera" size={48} color="#B6D5FA" style={{ alignSelf: 'center' }} />
            <Text style={styles.desc}>Chụp ảnh hóa đơn thuốc để AI tự động nhận diện và thêm vào kho</Text>
            <TouchableOpacity style={styles.btn} onPress={pickImage}>
              <Feather name="camera" size={18} color="#2563EB" />
              <Text style={styles.btnText}>Chụp ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={chooseFromLibrary}>
              <Feather name="image" size={18} color="#3B82F6" />
              <Text style={[styles.btnText, { color: '#2563EB' }]}>Chọn từ thư viện</Text>
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
              <Text style={{ color: '#fff', marginTop: 8 }}>AI đang phân tích hóa đơn...</Text>
            </View>
          )}
          {extractedData && (
            <View style={styles.resultCard}>
              <Text style={styles.successTitle}>✅ Nhận diện thành công!</Text>
              <Text style={styles.resultText}>Danh sách thuốc (có thể sửa):</Text>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80} style={{ flex: 0 }}>
                <ScrollView
                  style={{ maxHeight: 220, minHeight: 60 }}
                  contentContainerStyle={{ paddingBottom: 12 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                >
                   {editableMedicines.map((med: any, idx: number) => (
                     <View key={idx} style={styles.medicineItem}>
                      <TouchableOpacity style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }} onPress={() => {
                        const newMeds = editableMedicines.filter((_, i) => i !== idx);
                        setEditableMedicines(newMeds);
                      }}>
                        <Feather name="trash-2" size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <TextInput style={[styles.input, { fontWeight: 'bold', marginBottom: 4 }]} value={med.name} onChangeText={text => {
                        const newMeds = [...editableMedicines];
                        newMeds[idx].name = text;
                        setEditableMedicines(newMeds);
                      }} placeholder="Tên thuốc" />
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput style={[styles.input, { flex: 1 }]} value={med.quantity} onChangeText={text => {
                          if (/^\d*$/.test(text)) {
                            const newMeds = [...editableMedicines];
                            newMeds[idx].quantity = text;
                            setEditableMedicines(newMeds);
                          }
                        }} placeholder="Số lượng" keyboardType="numeric" />
                        <TouchableOpacity style={[styles.input, { width: 80, marginLeft: 8, justifyContent: 'center' }]} onPress={() => {
                          const newMeds = [...editableMedicines];
                          newMeds[idx].showUnitPicker = !newMeds[idx].showUnitPicker;
                          setEditableMedicines(newMeds);
                        }}>
                          <Text style={{ color: '#64748B' }}>{med.form || 'Đơn vị'}</Text>
                          <Feather name="chevron-down" size={18} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                      {med.showUnitPicker && (
                        <View style={{ backgroundColor: '#F0F6FF', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#B6D5FA' }}>
                          {['viên', 'lọ', 'ống', 'gói'].map(unit => (
                            <TouchableOpacity key={unit} style={{ padding: 10 }} onPress={() => {
                              const newMeds = [...editableMedicines];
                              newMeds[idx].form = unit;
                              newMeds[idx].showUnitPicker = false;
                              setEditableMedicines(newMeds);
                            }}>
                              <Text style={{ color: med.form === unit ? '#2563EB' : '#1E293B' }}>{unit}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      <TextInput
                        style={[styles.input, styles.noteInput]}
                        value={med.note || ''}
                        onChangeText={text => {
                          const newMeds = [...editableMedicines];
                          newMeds[idx].note = text;
                          setEditableMedicines(newMeds);
                        }}
                        placeholder="Ghi chú"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                      {Array.isArray(med.times) && med.times.length > 0 && (
                        <View style={{ marginTop: 6 }}>
                          <Text style={{ fontWeight: 'bold', color: '#2563EB' }}>Thời gian uống:</Text>
                          {med.times.map((t: any, i: number) => (
                            <Text key={i} style={{ color: '#64748B', marginLeft: 8 }}>• {t}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </KeyboardAvoidingView>
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => {
                  setExtractedData({ ...extractedData, medicines: editableMedicines });
                  handleAddToInventory();
                }}>
                  <Feather name="check-circle" size={18} color="#2563EB" />
                  <Text style={styles.btnText}>Thêm vào kho</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutline, { flex: 1, marginLeft: 8 }]} onPress={handleRetake}>
                  <Feather name="camera" size={18} color="#2563EB" />
                  <Text style={[styles.btnText, { color: '#2563EB' }]}>Chụp lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {!isProcessing && !extractedData && (
            <TouchableOpacity style={[styles.btn, styles.btnOutline, { marginTop: 12 }]} onPress={handleRetake}>
              <Feather name="camera" size={18} color="#3B82F6" />
              <Text style={[styles.btnText, { color: '#3B82F6' }]}>Chụp lại</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* UPGRADE modal (shown when server returns 403 / access denied) */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.patientModal, { maxHeight: 240 }]}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>Không thể truy cập dữ liệu</Text>
              <TouchableOpacity onPress={() => setUpgradeModalVisible(false)}>
                <MaterialIcons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingTop: 8 }}>
              <Text style={{ color: '#374151', fontSize: 15, lineHeight: 22 }}>
                {upgradeMessage || 'Bạn không có quyền truy cập dữ liệu người này. Vui lòng mua gói hoặc yêu cầu quyền.'}
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
                    // navigate to purchase/subscription screen
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

      {/* Patient selector modal */}
      <Modal visible={showPatientSelector} animationType="slide" transparent onRequestClose={() => setShowPatientSelector(false)}>
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.patientModal}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>Chọn người bệnh</Text>
              <TouchableOpacity onPress={() => setShowPatientSelector(false)}>
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={patients}
              keyExtractor={(item) => item._id || item.raw?.patient?._id || item.raw?._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[modalStyles.patientItem, selectedPatient?._id === item._id && modalStyles.selectedPatientItem]}
                  onPress={() => {
                    setSelectedPatient(item);
                    setPatientId(item._id);
                    setShowPatientSelector(false);
                  }}
                >
                  <Text style={modalStyles.patientName}>{item.fullName || 'Tên chưa cập nhật'}</Text>
                  {item.email ? <Text style={modalStyles.patientDetail}>Email: {item.email}</Text> : null}
                  {item.phone ? <Text style={modalStyles.patientDetail}>SĐT: {item.phone}</Text> : null}
                  {item.dateOfBirth ? <Text style={modalStyles.patientDetail}>Sinh: {new Date(item.dateOfBirth).toLocaleDateString('vi-VN')}</Text> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={modalStyles.emptyList}>
                  <Text style={modalStyles.emptyListText}>Chưa có người bệnh nào</Text>
                  <TouchableOpacity style={modalStyles.addPatientButton} onPress={() => {
                    setShowPatientSelector(false);
                    // @ts-ignore
                    navigation.navigate('AddRelative');
                  }}>
                    <Text style={modalStyles.addPatientButtonText}>+ Thêm người bệnh mới</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  patientModal: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  patientItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  selectedPatientItem: { backgroundColor: '#EBF4FF', borderLeftWidth: 3, borderLeftColor: '#4A7BA7' },
  patientName: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  patientDetail: { fontSize: 13, color: '#9CA3AF' },
  emptyList: { alignItems: 'center', paddingVertical: 40 },
  emptyListText: { textAlign: 'center', fontSize: 16, color: '#6B7280', padding: 20 },
  addPatientButton: { backgroundColor: '#4A7BA7', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16 },
  addPatientButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

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
    // prevent item from expanding uncontrollably
    overflow: 'hidden',
  },
  noteInput: {
    minHeight: 48,
    maxHeight: 120,
    paddingTop: 8,
    paddingBottom: 8,
  },
});

export default PhotoCaptureRelative;