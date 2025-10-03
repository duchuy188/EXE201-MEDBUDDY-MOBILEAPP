import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, FontAwesome, Feather } from '@expo/vector-icons';
import bloodPressureService, { BloodPressure } from '../api/bloodPressure';
import RelativePatientService from '../api/RelativePatient';
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
  const [relatives, setRelatives] = useState<any[]>([]);
  const [loadingRelatives, setLoadingRelatives] = useState(false);
  const route = useRoute();
  
  const token = route.params?.token || '';
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
    fetchRelatives();
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

  // Lấy danh sách người thân
  const fetchRelatives = async () => {
    if (!token) return;
    setLoadingRelatives(true);
    try {
      const data = await RelativePatientService.getRelativesOfPatient(token);
      setRelatives(data || []);
    } catch (e) {
      console.error('Lỗi khi lấy danh sách người thân:', e);
    } finally {
      setLoadingRelatives(false);
    }
  };

  // Hàm gọi điện
  const handleCallPhone = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Lỗi', 'Không có số điện thoại để gọi');
      return;
    }
    
    const phone = phoneNumber.replace(/\s/g, ''); // Loại bỏ khoảng trắng
    const phoneUrl = `tel:${phone}`;
    
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Lỗi', 'Thiết bị không hỗ trợ gọi điện');
        } else {
          return Linking.openURL(phoneUrl);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi gọi điện:', err);
        Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
      });
  };

  // Hàm nhắn tin SMS
  const handleSendSMS = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('Lỗi', 'Không có số điện thoại để nhắn tin');
      return;
    }
    
    const phone = phoneNumber.replace(/\s/g, ''); // Loại bỏ khoảng trắng
    const smsUrl = `sms:${phone}`;
    
    Linking.canOpenURL(smsUrl)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Lỗi', 'Thiết bị không hỗ trợ nhắn tin');
        } else {
          return Linking.openURL(smsUrl);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi nhắn tin:', err);
        Alert.alert('Lỗi', 'Không thể mở ứng dụng nhắn tin');
      });
  };

  const handleSaveBloodPressure = async () => {
    if (systolic && diastolic) {
      const sys = Number(systolic);
      const dia = Number(diastolic);
      // Kiểm tra giới hạn hợp lý
      if (isNaN(sys) || isNaN(dia)) {
        Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ cho huyết áp.');
        return;
      }
      if (sys < 70 || sys > 250) {
        Alert.alert('Lỗi', 'Huyết áp tâm thu (systolic) phải từ 70 đến 250 mmHg.');
        return;
      }
      if (dia < 40 || dia > 150) {
        Alert.alert('Lỗi', 'Huyết áp tâm trương (diastolic) phải từ 40 đến 150 mmHg.');
        return;
      }
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy mã người dùng. Vui lòng đăng nhập lại.');
        return;
      }
      try {
        setLoading(true);
        await bloodPressureService.addBloodPressure({
          userId: userId,
          systolic: sys,
          diastolic: dia,
        }, token);
        Alert.alert('Thành công', `Đã ghi nhận chỉ số huyết áp ${sys}/${dia}`);
        setSystolic('');
        setDiastolic('');
        fetchBpHistory();
      } catch (e) {
        Alert.alert('Lỗi', 'Không thể lưu chỉ số huyết áp');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBloodPressureMeasured = () => {
    Alert.alert('Cảm ơn bạn!', 'Đã ghi nhận việc đo huyết áp. Mời bạn nhập kết quả bên dưới.');
    setShowNotification(false);
  };

  const handleBloodPressureSnooze = () => {
    Alert.alert('Đã hẹn giờ nhắc lại', 'Hệ thống sẽ nhắc bạn đo huyết áp sau 10 phút');
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
                    // Format ngày giờ (so sánh theo ngày, không tính giờ)
                    const date = item.measuredAt ? new Date(item.measuredAt) : null;
                    let label = '';
                    if (date) {
                      const now = new Date();
                      // Lấy yyyy-mm-dd cho cả hai ngày
                      const getYMD = (d: Date) => d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
                      const getDMY = (d: Date) => d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth()+1).toString().padStart(2, '0') + '/' + d.getFullYear();
                      const ymdNow = getYMD(now);
                      const ymdDate = getYMD(date);
                      const dmyDate = getDMY(date);
                      // Tính số ngày chênh lệch
                      const dateOnlyNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const dateOnlyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      const diff = Math.round((dateOnlyNow.getTime() - dateOnlyDate.getTime()) / (1000 * 60 * 60 * 24));
                      if (ymdNow === ymdDate) label = `Hôm nay - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${dmyDate})`;
                      else if (diff === 1) label = `Hôm qua - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${dmyDate})`;
                      else label = `${diff} ngày trước - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${dmyDate})`;
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

          {/* Thẻ thuốc */}
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
              <Ionicons name="notifications" size={18} color="#3B82F6" />  Lịch uống thuốc hôm nay
            </Text>
            <View style={{backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#B6D5FA'}}>
              <View>
                <Text style={{fontWeight: 'bold', color: '#12B76A'}}>Amlodipine 5mg</Text>
                <Text style={{color: '#64748B', fontSize: 13}}>7:00 - Buổi sáng</Text>
              </View>
              <Text style={{color: '#12B76A', fontSize: 22}}>✓</Text>
            </View>
            <View style={{backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#B6D5FA'}}>
              <View>
                <Text style={{fontWeight: 'bold', color: '#3B82F6'}}>Candesartan 8mg</Text>
                <Text style={{color: '#64748B', fontSize: 13}}>19:00 - Buổi tối</Text>
              </View>
              <TouchableOpacity style={{backgroundColor: '#B6D5FA', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8}}>
                <Text style={{color: '#3B82F6', fontSize: 14, fontWeight: 'bold'}}>Uống ngay</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bảng điều khiển gia đình */}
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
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
              <FontAwesome5 name="users" size={22} color="#3B82F6" style={{marginRight: 8}} />
              <Text style={{fontWeight: 'bold', fontSize: 17, color: '#1E293B'}}>
                Bảng điều khiển gia đình
              </Text>
            </View>
            
            {loadingRelatives ? (
              <View style={{alignItems: 'center', paddingVertical: 20}}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={{color: '#64748B', marginTop: 8}}>Đang tải danh sách người thân...</Text>
              </View>
            ) : relatives.length > 0 ? (
              <View>
                {relatives.map((item, index) => {
                  const relative = item.relative; // Lấy thông tin người thân từ object relative
                  return (
                    <View key={item._id || index} style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2
                    }}>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                        {/* Avatar */}
                        {relative?.avatar && relative.avatar.trim() !== '' ? (
                          <Image 
                            source={{ uri: relative.avatar }}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              marginRight: 12,
                              backgroundColor: '#E2E8F0'
                            }}
                          />
                        ) : (
                          <View style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: '#3B82F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12
                          }}>
                            <Text style={{
                              color: '#fff',
                              fontSize: 18,
                              fontWeight: 'bold'
                            }}>
                              {relative?.fullName ? relative.fullName.charAt(0).toUpperCase() : 'T'}
                            </Text>
                          </View>
                        )}
                        
                        {/* Thông tin người thân */}
                        <View style={{flex: 1}}>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4}}>
                            <View style={{flex: 1}}>
                             <Text style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: '#1E293B',
                                lineHeight: 20
                              }}>
                                Tên:
                                {relative?.fullName || 'Người thân'}
                              </Text>
                              <Text style={{
                                fontSize: 14,
                                color: '#64748B',
                                marginTop: 2
                              }}>
                                Người thân
                              </Text>
                            </View>
                          </View>
                          
                          {/* Email và số điện thoại */}
                        
                          <Text style={{
                            fontSize: 12,
                            color: '#3B82F6',
                            marginBottom: 4
                          }}>
                            Email: 
                            {relative?.email || ''}
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            color: '#64748B',
                            marginBottom: 8
                          }}>
                            SĐT:
                            {relative?.phoneNumber || ''}
                          </Text>
                          
                          {/* Uống thuốc hôm nay */}
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 12
                          }}>
                            <Text style={{
                              fontSize: 13,
                              color: '#64748B',
                              marginRight: 8
                            }}>
                              Đang theo dõi
                            </Text>
                            <View style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#D1FAE5',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6
                            }}>
                              <Text style={{
                                fontSize: 12,
                                fontWeight: 'bold',
                                color: '#059669',
                                marginRight: 4
                              }}>
                                ✓ Hoạt động
                              </Text>
                            </View>
                          </View>
                          
                          {/* Buttons */}
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 8
                          }}>
                            <TouchableOpacity 
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderColor: '#3B82F6',
                                borderRadius: 8,
                                paddingVertical: 8,
                                paddingHorizontal: 12
                              }}
                              onPress={() => handleCallPhone(relative?.phoneNumber)}
                            >
                              <Ionicons name="call" size={16} color="#3B82F6" style={{marginRight: 4}} />
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#3B82F6'
                              }}>
                                Gọi
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderColor: '#3B82F6',
                                borderRadius: 8,
                                paddingVertical: 8,
                                paddingHorizontal: 12
                              }}
                              onPress={() => handleSendSMS(relative?.phoneNumber)}
                            >
                              <Ionicons name="chatbubble" size={16} color="#3B82F6" style={{marginRight: 4}} />
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#3B82F6'
                              }}>
                                Nhắn tin
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{alignItems: 'center', paddingVertical: 20}}>
                <Ionicons name="people-outline" size={48} color="#B6D5FA" />
                <Text style={{color: '#64748B', fontSize: 15, textAlign: 'center', marginTop: 8}}>
                  Chưa có người thân nào theo dõi sức khỏe của bạn.
                </Text>
                <TouchableOpacity style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginTop: 12
                }}>
                  <Text style={{color: '#fff', fontSize: 14, fontWeight: 'bold'}}>
                    Mời người thân
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          {/* Giao diện người chăm sóc - Báo cáo tuần */}
          <View style={[styles.section, {backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#A8E6CF'}]}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center'}}>
              <FontAwesome5 name="heartbeat" size={18} color="#4CB8C4" />  Tổng kết tuần
            </Text>
            <View style={{backgroundColor: '#A8E6CF', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Tuân thủ lịch uống thuốc</Text>
                <Text style={{color: '#666', fontSize: 13}}>6/7 ngày</Text>
              </View>
              <Text style={{color: '#388E3C', fontSize: 18, fontWeight: 'bold'}}>86%</Text>
            </View>
            <View style={{backgroundColor: '#E0F7FA', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Đo huyết áp đều đặn</Text>
                <Text style={{color: '#666', fontSize: 13}}>7/7 ngày</Text>
              </View>
              <Text style={{color: '#009688', fontSize: 18, fontWeight: 'bold'}}>100%</Text>
            </View>
            <View style={{backgroundColor: '#F7B2B7', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={{fontWeight: 'bold'}}>Chỉ số huyết áp trung bình</Text>
                <Text style={{color: '#666', fontSize: 13}}>Trong tuần</Text>
              </View>
              <Text style={{color: '#E91E63', fontSize: 18, fontWeight: 'bold'}}>125/82</Text>
            </View>
          </View>

          {/* Bảng điều khiển gia đình */}
          <View style={[styles.section, {backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#A0A4A8'}]}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10}}>
              <FontAwesome5 name="users" size={18} color="#4CB8C4" />  Bảng điều khiển gia đình (demo)
            </Text>
            <Text style={{color: '#666'}}>Theo dõi sức khỏe người thân trong thời gian thực.</Text>
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
