
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, FontAwesome, Feather } from '@expo/vector-icons';
import bloodPressureService, { BloodPressure } from '../api/bloodPressure';
import { useRoute } from '@react-navigation/native';

interface HomeScreenProps {
  userType?: 'patient' | 'family';
  onLogout?: () => void;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ userType = 'patient', onLogout }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bpHistory, setBpHistory] = useState<BloodPressure[]>([]);
  const route = useRoute();
  // Lấy token và userId từ navigation params
  // @ts-ignore
  const token = route.params?.token || '';
  // @ts-ignore
  const userId = route.params?.userId || '';
  // Debug log
  React.useEffect(() => {
    console.log('HomeScreen params:', route.params);
    console.log('HomeScreen token:', token);
    console.log('HomeScreen userId:', userId);
  }, [route.params, token, userId]);

  // Lấy lịch sử huyết áp khi vào màn hình
  useEffect(() => {
    if (!token) return;
    fetchBpHistory();
  }, [token]);

  const fetchBpHistory = async () => {
    setLoading(true);
    try {
      const data = await bloodPressureService.getBloodPressureHistory(token);
      setBpHistory(data || []);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu huyết áp');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBloodPressure = async () => {
    if (systolic && diastolic) {
      const sys = Number(systolic);
      const dia = Number(diastolic);
      // Giới hạn hợp lý
      if (isNaN(sys) || isNaN(dia)) {
        Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ cho huyết áp.');
        return;
      }
      if (sys < 70 || sys > 250) {
        Alert.alert('Lỗi', 'Tâm thu (systolic) phải từ 70 đến 250 mmHg.');
        return;
      }
      if (dia < 40 || dia > 150) {
        Alert.alert('Lỗi', 'Tâm trương (diastolic) phải từ 40 đến 150 mmHg.');
        return;
      }
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy userId. Vui lòng đăng nhập lại.');
        return;
      }
      try {
        setLoading(true);
        await bloodPressureService.addBloodPressure({
          userId: userId,
          systolic: sys,
          diastolic: dia,
        }, token);
        Alert.alert('Đã lưu thành công', `Huyết áp ${sys}/${dia} đã được ghi nhận`);
        setSystolic('');
        setDiastolic('');
        fetchBpHistory();
      } catch (e) {
        Alert.alert('Lỗi', 'Không thể lưu huyết áp');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBloodPressureMeasured = () => {
    Alert.alert('Cảm ơn bạn!', 'Đã ghi nhận việc đo huyết áp. Hãy nhập kết quả bên dưới.');
    setShowNotification(false);
  };

  const handleBloodPressureSnooze = () => {
    Alert.alert('Đã lên lịch nhắc lại', 'Sẽ nhắc bạn đo huyết áp sau 10 phút nữa');
    setShowNotification(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{marginBottom: 18}}>
        <LinearGradient colors={userType === 'patient' ? ["#F0F6FF", "#F0F6FF"] : ["#F7B2B7", "#A8E6CF"]} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, {color: '#1E293B'}]}>{userType === 'patient' ? 'Chào buổi sáng!' : 'Theo dõi người thân'}</Text>
              <Text style={[styles.username, {color: '#3B82F6'}]}>{userType === 'patient' ? 'Bạn cảm thấy thế nào?' : 'Mẹ Nguyễn Thị Lan'}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {userType === 'patient' && (
                <TouchableOpacity onPress={() => setShowNotification(!showNotification)} style={{marginRight: 10}}>
                  <View>
                    <Ionicons name="notifications" size={28} color="#3B82F6" />
                    <View style={{position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: '#F04438', borderRadius: 5}} />
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onLogout}>
                <Ionicons name="person-circle" size={32} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Blood Pressure Notification Modal */}
      {userType === 'patient' && showNotification && (
        <View style={styles.notificationModal}>
          <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 8}}>Đã đến giờ đo huyết áp!</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity style={styles.modalBtn} onPress={handleBloodPressureMeasured}>
              <Text style={{color: '#fff'}}>Đã đo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#A0A4A8'}]} onPress={handleBloodPressureSnooze}>
              <Text style={{color: '#fff'}}>Nhắc lại sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* AI Health Insights - for family */}
      {userType === 'family' && (
        <View style={[styles.section, {backgroundColor: '#F7B2B7', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#F7B2B7', marginBottom: 18}]}> 
          <View style={{alignItems: 'center', marginBottom: 10}}>
            <LinearGradient colors={["#F7B2B7", "#A8E6CF"]} style={{width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center'}}>
              <Feather name="shield" size={32} color="#fff" />
            </LinearGradient>
            <Text style={{fontWeight: 'bold', fontSize: 18, color: '#222', marginTop: 8}}>Mẹ Nguyễn Thị Lan</Text>
            <Text style={{color: '#666'}}>Tình trạng hôm nay: Tốt</Text>
          </View>
        </View>
      )}

      {/* Patient UI */}
      {userType === 'patient' ? (
        <>
          {/* Greeting Card */}
          <View style={[styles.section, {
            backgroundColor: '#F0F6FF',
            borderRadius: 24,
            padding: 18,
            borderWidth: 1,
            borderColor: '#B6D5FA',
            marginBottom: 18
          }]}> 
            <View style={{alignItems: 'center', marginBottom: 10}}>
              <View style={{width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B6D5FA'}}>
                <FontAwesome name="heart" size={32} color="#3B82F6" />
              </View>
              <Text style={{color: '#64748B', marginTop: 8}}>Hôm nay bạn cảm thấy thế nào?</Text>
            </View>
          </View>

          {/* Blood Pressure Input Section */}
          <View style={[styles.section, {
            backgroundColor: '#F0F6FF',
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: '#B6D5FA',
            shadowColor: '#F0F6FF',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 1
          }]}> 
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: '#1E293B', flexDirection: 'row', alignItems: 'center'}}>
              <FontAwesome5 name="heartbeat" size={18} color="#3B82F6" />  Cập nhật huyết áp
            </Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
              <View style={{flex: 1, marginRight: 8}}>
                <Text style={{fontSize: 14, color: '#64748B', marginBottom: 4}}>Tâm thu</Text>
                <TextInput
                  style={[styles.bpInput, {backgroundColor: '#fff', borderColor: '#B6D5FA', color: '#1E293B'}]}
                  keyboardType="numeric"
                  placeholder="120"
                  placeholderTextColor="#B6D5FA"
                  value={systolic}
                  onChangeText={setSystolic}
                />
              </View>
              <View style={{flex: 1, marginLeft: 8}}>
                <Text style={{fontSize: 14, color: '#64748B', marginBottom: 4}}>Tâm trương</Text>
                <TextInput
                  style={[styles.bpInput, {backgroundColor: '#fff', borderColor: '#B6D5FA', color: '#1E293B'}]}
                  keyboardType="numeric"
                  placeholder="80"
                  placeholderTextColor="#B6D5FA"
                  value={diastolic}
                  onChangeText={setDiastolic}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, {
                backgroundColor: systolic && diastolic ? '#3B82F6' : '#B6D5FA',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, paddingVertical: 12, marginTop: 6, marginBottom: 0
              }]}
              onPress={handleSaveBloodPressure}
              disabled={!systolic || !diastolic}
            >
              <FontAwesome name="plus" size={18} color={systolic && diastolic ? '#fff' : '#3B82F6'} />
              <Text style={{color: systolic && diastolic ? '#fff' : '#3B82F6', fontWeight: 'bold', marginLeft: 8}}>Lưu kết quả</Text>
            </TouchableOpacity>

            {/* Recent readings */}
            <View style={{marginTop: 18, borderTopWidth: 1, borderTopColor: '#B6D5FA', paddingTop: 10}}>
              <Text style={{fontWeight: 'bold', color: '#3B82F6', marginBottom: 8}}>📊 Kết quả gần đây</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                bpHistory && bpHistory.length > 0 ? (
                  bpHistory.slice(0, 3).map((item, idx) => {
                    // Format ngày giờ
                    const date = item.measuredAt ? new Date(item.measuredAt) : null;
                    let label = '';
                    if (date) {
                      const now = new Date();
                      let diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                      if (diff < 0) diff = 0; // Nếu ngày đo là tương lai, coi như hôm nay
                      if (diff === 0) label = `Hôm nay - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      else if (diff === 1) label = `Hôm qua - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      else label = `${diff} ngày trước - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    }
                    // Đánh giá huyết áp
                    let color = '#12B76A';
                    let reason = '';
                    const sys = item.systolic;
                    const dia = item.diastolic;
                    if (sys < 90 || dia < 60) {
                      color = '#F04438';
                      reason = 'Hạ huyết áp';
                    } else if (sys >= 140 || dia >= 90) {
                      color = '#F04438';
                      reason = 'Tăng huyết áp';
                    } else {
                      color = '#12B76A';
                      reason = 'Bình thường';
                    }
                    return (
                      <View key={item._id || idx} style={{backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#B6D5FA'}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                          <Text style={{color: '#64748B'}}>{label || '---'}</Text>
                          <Text style={{fontWeight: 'bold', color, fontSize: 16}}>{item.systolic}/{item.diastolic}</Text>
                        </View>
                        <Text style={{color, fontSize: 13, marginTop: 2}}>
                          {reason === 'Bình thường' ? 'Huyết áp bình thường' : reason === 'Tăng huyết áp' ? 'Tăng huyết áp - nên nghỉ ngơi, theo dõi hoặc hỏi ý kiến bác sĩ' : 'Hạ huyết áp - nên nghỉ ngơi, uống nước và theo dõi'}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{color: '#64748B'}}>Chưa có dữ liệu</Text>
                )
              )}
            </View>
          </View>

          {/* Medication Card */}
          <View style={[styles.section, {
            backgroundColor: '#F0F6FF',
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: '#B6D5FA',
            shadowColor: '#F0F6FF',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 1
          }]}> 
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: '#1E293B', flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="notifications" size={18} color="#3B82F6" />  Thuốc hôm nay
            </Text>
            <View style={{backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#B6D5FA'}}>
              <View>
                <Text style={{fontWeight: 'bold', color: '#12B76A'}}>Amlodipine 5mg</Text>
                <Text style={{color: '#64748B', fontSize: 13}}>7:00 AM - Sáng</Text>
              </View>
              <Text style={{color: '#12B76A', fontSize: 22}}>✓</Text>
            </View>
            <View style={{backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#B6D5FA'}}>
              <View>
                <Text style={{fontWeight: 'bold', color: '#3B82F6'}}>Candesartan 8mg</Text>
                <Text style={{color: '#64748B', fontSize: 13}}>7:00 PM - Tối</Text>
              </View>
              <TouchableOpacity style={{backgroundColor: '#B6D5FA', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8}}>
                <Text style={{color: '#3B82F6', fontSize: 14, fontWeight: 'bold'}}>Uống ngay</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Real-time Family Dashboard placeholder */}
<View style={{
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 18,
  marginHorizontal: 20,
  marginBottom: 18,
  borderWidth: 1.5,
  borderColor: '#B6D5FA',
  flexDirection: 'column',
  shadowColor: '#F0F6FF',
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 1
}}>
  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
    <FontAwesome5 name="users" size={22} color="#3B82F6" style={{marginRight: 8}} />
    <Text style={{fontWeight: 'bold', fontSize: 17, color: '#1E293B'}}>
      Dashboard gia đình (demo)
    </Text>
  </View>
  <Text style={{color: '#64748B', fontSize: 15}}>
    Theo dõi sức khỏe người thân theo thời gian thực.
  </Text>
</View>
        </>
      ) : (
        <>
          {/* Family UI - Weekly Report */}
          <View style={[styles.section, {backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#A8E6CF'}]}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center'}}>
              <FontAwesome5 name="heartbeat" size={18} color="#4CB8C4" />  Báo cáo tuần này
            </Text>
            <View style={{backgroundColor: '#A8E6CF', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Uống thuốc đúng giờ</Text>
                <Text style={{color: '#666', fontSize: 13}}>6/7 ngày</Text>
              </View>
              <Text style={{color: '#388E3C', fontSize: 18, fontWeight: 'bold'}}>86%</Text>
            </View>
            <View style={{backgroundColor: '#E0F7FA', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Đo huyết áp</Text>
                <Text style={{color: '#666', fontSize: 13}}>7/7 ngày</Text>
              </View>
              <Text style={{color: '#009688', fontSize: 18, fontWeight: 'bold'}}>100%</Text>
            </View>
            <View style={{backgroundColor: '#F7B2B7', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Huyết áp trung bình</Text>
                <Text style={{color: '#666', fontSize: 13}}>Tuần này</Text>
              </View>
              <Text style={{color: '#E91E63', fontSize: 18, fontWeight: 'bold'}}>125/82</Text>
            </View>
          </View>

          {/* Real-time Family Dashboard placeholder */}
          <View style={[styles.section, {backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#A0A4A8'}]}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10}}>
              <FontAwesome5 name="users" size={18} color="#4CB8C4" />  Dashboard gia đình (demo)
            </Text>
            <Text style={{color: '#666'}}>Theo dõi sức khỏe người thân theo thời gian thực.</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 24,
    paddingTop: 0,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
    marginHorizontal: 20,
  },
  notificationModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FFD600',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: '#4CB8C4',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  bpInput: {
    borderWidth: 1,
    borderColor: '#A0A4A8',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#F6F8FB',
    textAlign: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 0,
  },
});

export default HomeScreen;
