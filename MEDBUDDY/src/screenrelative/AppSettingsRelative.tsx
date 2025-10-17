import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, SafeAreaView, Modal, TextInput, Button, Platform, ActivityIndicator, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBloodPressureReminder } from '../api/BloodPressureReminder';
import { updateBloodPressureReminder } from '../api/BloodPressureReminder';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const AppSettingsRelative = ({ navigation, route }: any) => {
  const [reminderId, setReminderId] = useState<string | null>(null);
  const defaultFontSize = 100;
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [isBpReminderActive, setIsBpReminderActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState<any | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Lấy token từ AsyncStorage khi mở modal
  React.useEffect(() => {
    if (modalVisible) {
      (async () => {
        const t = await AsyncStorage.getItem('token');
        setToken(t);
      })();
    }
  }, [modalVisible]);

  // get patientId/userId from route params (RelativeNavigator passes initialParams)
  const routeObj = route || (useRoute && useRoute());
  const patientIdFromParams = routeObj?.params?.userId || routeObj?.params?.patientId || null;

  // If not provided via params, try AsyncStorage for userId
  const [patientId, setPatientId] = useState<string | null>(patientIdFromParams || null);
  useEffect(() => {
    (async () => {
      // always load stored userId as fallback
      if (!patientId) {
        const uid = await AsyncStorage.getItem('userId');
        if (uid) setPatientId(uid);
      }
      // pre-load token too
      const t = await AsyncStorage.getItem('token');
      if (t) setToken(t);
    })();
  }, []);

  const loadPatients = async (authToken: string) => {
    try {
      setLoadingPatients(true);
      const res = await RelativePatientService.getPatientsOfRelative(authToken);
      const list = res?.patients || res?.data || res || [];
      const arr = Array.isArray(list) ? list : [];
      const normalized = arr.map((item: any) => {
        const p = item?.patient || item;
        return {
          _id: p?._id || p?.id || '',
          fullName: p?.fullName || p?.full_name || p?.name || '',
          email: p?.email || '',
        };
      });
      setPatients(normalized);
    } catch (e) {
      console.log('Load patients error', e);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backButton, { width: 80 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
            <Text style={{ color: '#1a1a1a', marginLeft: 4, fontWeight: '500' }}>Quay lại</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Cài đặt</Text>
        </View>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* CHUNG */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CHUNG</Text>
          <View style={styles.menuItem}>
            <View style={{flex: 1}}>
              <Text style={styles.menuTitle}>Cỡ chữ</Text>
              <Text style={styles.menuSubtitle}>Điều chỉnh kích thước chữ cho toàn bộ ứng dụng</Text>
            </View>
            <View style={styles.fontSizeControl}>
              <TouchableOpacity 
                style={styles.fontSizeButton}
                onPress={() => setFontSize(prev => Math.max(50, prev - 10))}
              >
                <Text style={styles.fontSizeButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeValue}>{Math.round(fontSize)}%</Text>
              <TouchableOpacity 
                style={styles.fontSizeButton}
                onPress={() => setFontSize(prev => Math.min(300, prev + 10))}
              >
                <Text style={styles.fontSizeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
{/* <TouchableOpacity 
  style={styles.menuItem}
  onPress={() => navigation.navigate('PackageHistory')}
>
  <Text style={styles.menuTitle}>Xem lịch sử thanh toán</Text>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity> */}
        </View>

        {/* CÀI ĐẶT NÂNG CAO */}
<View style={styles.section}>
  <Text style={styles.sectionHeader}>CÀI ĐẶT NÂNG CAO</Text>
    {/* <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('CurrentPackage')}
  >
    <Text style={styles.menuTitle}>Xem gói hiện tại</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity> */}
  {/* <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('PackageScreen')}
  >
    <Text style={styles.menuTitle}>Nâng cấp tài khoản</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity> */}

  <TouchableOpacity
    style={styles.menuItem}
    onPress={async () => {
      // Ensure we have a token
      let t = token;
      if (!t) t = await AsyncStorage.getItem('token');
      if (!t) {
        // navigate anyway with patientId fallback
        navigation.navigate('PatientCurrentPackage', { patientId });
        return;
      }

      // try load patients for this relative; if none, fall back to patientId
      await loadPatients(t);
      if (patients.length === 0) {
        navigation.navigate('PatientCurrentPackage', { patientId });
      } else if (patients.length === 1) {
        navigation.navigate('PatientCurrentPackage', { patientId: patients[0]._id });
      } else {
        setShowPatientSelector(true);
      }
    }}
  >
    <Text style={styles.menuTitle}>Xem gói của người bệnh</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  <Modal visible={showPatientSelector} animationType="slide" transparent onRequestClose={() => setShowPatientSelector(false)}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '90%', maxHeight: '75%' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Chọn người bệnh</Text>
          <TouchableOpacity onPress={() => setShowPatientSelector(false)}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
        </View>

        {loadingPatients ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(it) => it._id || it.email || Math.random().toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }} onPress={() => {
                setSelectedPatientForView(item);
                setShowPatientSelector(false);
                navigation.navigate('PatientCurrentPackage', { patientId: item._id });
              }}>
                <Text style={{ fontWeight: '700', color: '#111' }}>{item.fullName || 'Tên chưa cập nhật'}</Text>
                <Text style={{ color: '#9CA3AF', marginTop: 6 }}>{item.email || ''}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => <Text style={{ color: '#6B7280', padding: 12 }}>Chưa có người bệnh</Text>}
          />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => setShowPatientSelector(false)}>
            <Text style={{ color: '#6B7280' }}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
</View>

        {/* TÀI KHOẢN */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TÀI KHOẢN</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuTitle}>Ngôn ngữ</Text>
            <Text style={styles.menuSubtitle}>Tiếng việt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, {marginTop: 20}]}>
            <View>
              <Text style={[styles.menuTitle, {color: '#ef4444'}]}>Xóa tài khoản này</Text>
              <Text style={styles.menuSubtitle}>Xóa vĩnh viễn tài khoản và thông tin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  fontSizeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  fontSizeButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2563eb',
  },
  fontSizeValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginHorizontal: 12,
    minWidth: 45,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    letterSpacing: 0.2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
});

export default AppSettingsRelative;
