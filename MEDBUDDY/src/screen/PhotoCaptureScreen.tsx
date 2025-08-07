import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

const mockExtractedData = {
  medicines: [
    {
      name: "Amlodipine",
      dosage: "5mg",
      quantity: 30,
      price: "45.000 VNĐ",
      instructions: "Uống 1 viên/ngày sau ăn"
    },
    {
      name: "Metformin",
      dosage: "500mg", 
      quantity: 60,
      price: "32.000 VNĐ",
      instructions: "Uống 2 viên/ngày, sáng và tối"
    }
  ],
  pharmacy: "Nhà thuốc ABC",
  date: "15/06/2024",
  totalAmount: "77.000 VNĐ"
};

const PhotoCaptureScreen: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      setCapturedImage(result.assets[0].uri);
      processImage();
    }
  };

  const chooseFromLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length) {
      setCapturedImage(result.assets[0].uri);
      processImage();
    }
  };

  const processImage = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setExtractedData(mockExtractedData);
      setIsProcessing(false);
    }, 3000);
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
              <Text style={styles.resultText}>Nhà thuốc: {extractedData.pharmacy}</Text>
              <Text style={styles.resultText}>Ngày: {extractedData.date}</Text>
              <Text style={styles.resultText}>Tổng tiền: {extractedData.totalAmount}</Text>
              <Text style={styles.resultText}>Danh sách thuốc:</Text>
              {extractedData.medicines.map((med: any, idx: number) => (
                <View key={idx} style={styles.medicineItem}>
                  <Text style={{fontWeight: 'bold'}}>{med.name}</Text>
                  <Text>{med.dosage} - SL: {med.quantity}</Text>
                  <Text style={{fontSize: 12, color: '#64748B'}}>{med.instructions}</Text>
                  <Text style={{color: '#16a34a', fontWeight: 'bold'}}>{med.price}</Text>
                </View>
              ))}
              <View style={{flexDirection: 'row', marginTop: 12}}>
                <TouchableOpacity style={[styles.btn, {flex: 1}]} onPress={handleAddToInventory}>
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
  medicineItem: { backgroundColor: '#fff', borderRadius: 8, padding: 8, marginVertical: 4, borderWidth: 1, borderColor: '#B6D5FA' },
});

export default PhotoCaptureScreen;