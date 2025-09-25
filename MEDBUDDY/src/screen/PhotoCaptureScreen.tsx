
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import OrcService from '../api/orc';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

const PhotoCaptureScreen: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [editableMedicines, setEditableMedicines] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const route = useRoute();

  React.useEffect(() => {
    // Ưu tiên lấy token từ route.params, fallback AsyncStorage nếu không có
    const getToken = async () => {
      // @ts-ignore
      const paramToken = route.params?.token;
      if (paramToken) {
        setToken(paramToken);
      } else {
        const storedToken = await (await import('@react-native-async-storage/async-storage')).default.getItem('token');
        if (storedToken) setToken(storedToken);
      }
    };
    getToken();
  }, [route.params]);

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
      const ocrResult = await OrcService.recognizePrescription(image, token);
      setExtractedData(ocrResult);
      if (ocrResult?.medicines) {
        setEditableMedicines(ocrResult.medicines.map((med: any) => ({ ...med })));
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể nhận diện ảnh. Vui lòng thử lại.');
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



  const handleAddToInventory = () => {
    Alert.alert('Thêm vào kho thành công!', 'Thông tin thuốc đã được thêm vào kho.');
    setCapturedImage(null);
    setExtractedData(null);
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
      {!capturedImage ? (
        <View>
          <View style={styles.card}>
            <Feather name="camera" size={48} color="#B6D5FA" style={{alignSelf: 'center'}} />
            <Text style={styles.desc}>Chụp ảnh hóa đơn thuốc để AI tự động nhận diện và thêm vào kho</Text>
            <TouchableOpacity style={styles.btn} onPress={pickImage}>
              <Feather name="camera" size={18} color="#fff" />
              <Text style={styles.btnText}>Chụp ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={chooseFromLibrary}>
              <Feather name="image" size={18} color="#3B82F6" />
              <Text style={[styles.btnText, {color: '#3B82F6'}]}>Chọn từ thư viện</Text>
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
                keyboardShouldPersistTaps="handled"
              >
                <ScrollView
                  style={{maxHeight: 220}}
                  contentContainerStyle={{paddingBottom: 100}}
                  keyboardShouldPersistTaps="handled"
                >
                  {editableMedicines.map((med: any, idx: number) => (
                    <View key={idx} style={styles.medicineItem}>
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
                      <TextInput
                        style={styles.input}
                        value={med.quantity}
                        onChangeText={text => {
                          const newMeds = [...editableMedicines];
                          newMeds[idx].quantity = text;
                          setEditableMedicines(newMeds);
                        }}
                        placeholder="Số lượng"
                      />
                      <TextInput
                        style={styles.input}
                        value={med.usage || ''}
                        onChangeText={text => {
                          const newMeds = [...editableMedicines];
                          newMeds[idx].usage = text;
                          setEditableMedicines(newMeds);
                        }}
                        placeholder="HDSD"
                      />
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
                    </View>
                  ))}
                </ScrollView>
              </KeyboardAvoidingView>
              <View style={{flexDirection: 'row', marginTop: 12}}>
                <TouchableOpacity style={[styles.btn, {flex: 1}]} onPress={() => {
                  setExtractedData({ ...extractedData, medicines: editableMedicines });
                  handleAddToInventory();
                }}>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={styles.btnText}>Thêm vào kho</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutline, {flex: 1, marginLeft: 8}]} onPress={handleRetake}>
                  <Feather name="camera" size={18} color="#3B82F6" />
                  <Text style={[styles.btnText, {color: '#3B82F6'}]}>Chụp lại</Text>
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
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 12, marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  btnOutline: { backgroundColor: '#F0F6FF', borderWidth: 1, borderColor: '#3B82F6' },
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
});

export default PhotoCaptureScreen;