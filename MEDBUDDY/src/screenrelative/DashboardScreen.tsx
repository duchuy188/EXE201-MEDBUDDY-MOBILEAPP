import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Linking,
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Ionicons, 
  MaterialIcons, 
  FontAwesome5, 
  FontAwesome, 
  Feather 
} from '@expo/vector-icons';
import RelativePatientService from '../api/RelativePatient'; // Thêm dòng này
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeeklyReportCard from '../components/WeeklyReportCard';
import { useNavigation } from '@react-navigation/native';
import UserPackageService from '../api/UserPackage';

interface DashboardScreenProps {
  userType: 'patient' | 'relative';
  onLogout?: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ userType, onLogout }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [relatives, setRelatives] = useState<any[]>([]);
  const [loadingRelatives, setLoadingRelatives] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [weeklyOverviewData, setWeeklyOverviewData] = useState<any | null>(null);
  const [fullOverviewData, setFullOverviewData] = useState<any | null>(null);
  const [bpForPatient, setBpForPatient] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<{type: string, name: string, daysLeft?: number}>({type: 'trial', name: 'Gói dùng thử'});
  
  const navigation = useNavigation();

  const handleSaveBloodPressure = () => {
    if (systolic && diastolic) {
      Alert.alert(
        "Đã lưu thành công",
        `Huyết áp ${systolic}/${diastolic} đã được ghi nhận`
      );
      setSystolic('');
      setDiastolic('');
    }
  };

  const handleBloodPressureMeasured = () => {
    Alert.alert(
      "Cảm ơn bạn!",
      "Đã ghi nhận việc đo huyết áp. Hãy nhập kết quả bên dưới."
    );
    setShowNotification(false);
  };

  const handleBloodPressureSnooze = () => {
    Alert.alert(
      "Đã lên lịch nhắc lại",
      "Sẽ nhắc bạn đo huyết áp sau 10 phút nữa"
    );
    setShowNotification(false);
  };

  useEffect(() => {
    const fetchPatientsOfRelative = async () => {
      setLoadingRelatives(true);
      try {
        const t = await AsyncStorage.getItem('token');
        setToken(t);
        if (t) {
          const data = await RelativePatientService.getPatientsOfRelative(t);
          const arr = data || [];
          setRelatives(arr);
          // auto-select first patient (support payloads where items have .patient)
          if (Array.isArray(arr) && arr.length > 0) {
            const raw = arr[0];
            const p = raw.patient ? raw.patient : raw;
            setSelectedPatient({ _id: p._id || p.id, fullName: p.fullName || p.name, email: p.email });
          }
          // Fetch package info with token
          fetchCurrentPackage(t);
        }
      } catch (e) {
        Alert.alert('Lỗi', 'Không thể lấy danh sách.');
      } finally {
        setLoadingRelatives(false);
      }
    };
    fetchPatientsOfRelative();
  }, []);

  // Lấy thông tin gói hiện tại từ API
  const fetchCurrentPackage = async (t?: string) => {
    const currentToken = t || token;
    if (!currentToken) return;
    try {
      const packageData = await UserPackageService.getMyActivePackage(currentToken);
      
      if (packageData && packageData.data && packageData.data.package) {
        const packageName = packageData.data.package.name;
        
        // Logic xác định gói dựa trên tên gói
        const isTrial = packageName.toLowerCase().includes('dùng thử') || 
                       packageName.toLowerCase().includes('trial') ||
                       packageName.toLowerCase().includes('miễn phí');
        
        setCurrentPackage({
          type: isTrial ? 'trial' : 'pro',
          name: packageName,
          daysLeft: packageData.data.daysRemaining
        });
      } else {
        // Fallback nếu không có gói active
        setCurrentPackage({type: 'trial', name: 'Gói dùng thử'});
      }
    } catch (e) {
      // Fallback về trial nếu API lỗi
      setCurrentPackage({type: 'trial', name: 'Gói dùng thử'});
    }
  };

  // Fetch report data for selected patient
  useEffect(() => {
    if (!token || !selectedPatient?._id) return;
    const fetchReport = async () => {
      setLoadingReport(true);
      try {
        const weeklyResp = await RelativePatientService.getPatientWeeklyOverview(selectedPatient._id, token!);
        const fullResp = await RelativePatientService.getPatientFullOverview(selectedPatient._id, token!);
        const bpResp = await RelativePatientService.getPatientBloodPressures(selectedPatient._id, token!);
        const weekly = weeklyResp?.data ?? weeklyResp ?? null;
        const full = fullResp?.data ?? fullResp ?? null;
        const bpArr = Array.isArray(bpResp) ? bpResp.slice(0,7) : (bpResp?.data || bpResp?.bloodPressures || []);
        setWeeklyOverviewData(weekly || null);
        setFullOverviewData(full || null);
        setBpForPatient(Array.isArray(bpArr) ? bpArr : []);
      } catch (err) {
        console.error('Failed to fetch report for patient', err);
        setWeeklyOverviewData(null);
        setFullOverviewData(null);
        setBpForPatient([]);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [token, selectedPatient?._id]);

  // Thêm hàm hỗ trợ gọi và nhắn tin
  const handleCallFamily = async (phone?: string) => {
    if (!phone) {
      Alert.alert('Lỗi', 'Không có số điện thoại.');
      return;
    }
    const url = `tel:${phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Lỗi', 'Thiết bị không hỗ trợ thực hiện cuộc gọi.');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi.');
    }
  };

  const handleMessageFamily = async (phone?: string) => {
    if (!phone) {
      Alert.alert('Lỗi', 'Không có số điện thoại.');
      return;
    }
    const url = `sms:${phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Lỗi', 'Thiết bị không hỗ trợ nhắn tin SMS.');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể mở ứng dụng nhắn tin.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={{marginBottom: 18}}>
        <LinearGradient colors={userType === 'patient' ? ["#F0F6FF", "#F0F6FF"] : ["#E8F5FF", "#D7EEFF"]} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            {userType === 'patient' ? (
              <View>
                <Text style={[styles.greeting]}>{'Chào buổi sáng!'}</Text>
                <Text style={[styles.username]}>{'Bạn cảm thấy thế nào?'}</Text>
              </View>
            ) : (
              <View style={styles.headerCenter}>
                <Text style={styles.centerTitle}>Theo dõi người thân</Text>
              </View>
            )}
            <View style={styles.headerIcons}>
              {userType === 'patient' && (
                <TouchableOpacity onPress={() => setShowNotification(!showNotification)} style={styles.iconBtn}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="notifications" size={18} color="#2563EB" />
                    <View style={styles.notificationBadge} />
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.packageBadge}
                onPress={() => (navigation as any).navigate('PatientCurrentPackage')}
              >
                <View style={styles.badgeContainer}>
                  {currentPackage.type === 'trial' ? (
                    <View style={styles.trialIcon}>
                      <Ionicons name="time" size={16} color="#fff" />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      style={styles.proIcon}
                    >
                      <Ionicons name="star" size={16} color="#fff" />
                    </LinearGradient>
                  )}
                  <Text style={[
                    styles.packageText,
                    {color: currentPackage.type === 'trial' ? '#FFD700' : '#FFD700'}
                  ]}>
                    {currentPackage.type === 'trial' ? 'DÙNG THỬ' : 'TRẢ PHÍ'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Blood Pressure Notification Modal */}
      {userType === 'patient' && showNotification && (
        <View style={styles.notificationModal}>
          <Text style={styles.notificationTitle}>Đã đến giờ đo huyết áp!</Text>
          <View style={styles.notificationButtons}>
            <TouchableOpacity
              style={[styles.notificationBtn2, { backgroundColor: '#4A90C2' }]}
              onPress={handleBloodPressureMeasured}
            >
              <Text style={styles.notificationBtnText}>Đã đo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notificationBtn2, { backgroundColor: '#A0A4A8' }]}
              onPress={handleBloodPressureSnooze}
            >
              <Text style={styles.notificationBtnText}>Nhắc lại sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {userType === 'patient' ? (
        <>
          {/* Greeting Card */}
          <View style={styles.greetingCard}>
            <View style={styles.cardIconContainer}>
              <View style={styles.cardIcon}>
                <FontAwesome name="heart" size={32} color="#fff" />
              </View>
            </View>
            <Text style={styles.greetingText}>Hôm nay bạn cảm thấy thế nào?</Text>
          </View>

          {/* Blood Pressure Input Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="heartbeat" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Cập nhật huyết áp</Text>
            </View>
            
            <View style={styles.bloodPressureInputs}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tâm thu</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="120"
                  placeholderTextColor="#A0A4A8"
                  value={systolic}
                  onChangeText={setSystolic}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tâm trương</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="80"
                  placeholderTextColor="#A0A4A8"
                  value={diastolic}
                  onChangeText={setDiastolic}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: systolic && diastolic ? '#3B82F6' : '#B6D5FA',
                }
              ]}
              onPress={handleSaveBloodPressure}
              disabled={!systolic || !diastolic}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Lưu kết quả</Text>
            </TouchableOpacity>

            {/* Recent readings */}
            <View style={styles.recentReadings}>
              <Text style={styles.recentTitle}>📊 Kết quả gần đây</Text>
              
              <View style={[styles.readingRow, { backgroundColor: '#fff' }]}>
                <Text style={styles.readingDate}>Hôm nay - 8:00 AM</Text>
                <Text style={[styles.readingValue, { color: '#12B76A' }]}>120/80</Text>
              </View>

              <View style={[styles.readingRow, { backgroundColor: '#fff' }]}>
                <Text style={styles.readingDate}>Hôm qua - 7:30 AM</Text>
                <Text style={[styles.readingValue, { color: '#3B82F6' }]}>125/82</Text>
              </View>

              <View style={[styles.readingRow, { backgroundColor: '#fff' }]}>
                <Text style={styles.readingDate}>2 ngày trước - 8:15 AM</Text>
                <Text style={[styles.readingValue, { color: '#F04438' }]}>130/85</Text>
              </View>
            </View>
          </View>

          {/* AI Health Analysis */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Gợi ý từ AI</Text>
            </View>
            
            <View style={[styles.aiCard, { backgroundColor: '#F0F6FF', borderColor: '#B6D5FA' }]}>
              <Text style={styles.aiText}>
                Dựa trên dữ liệu của bạn, thời điểm tốt nhất để đo huyết áp là 7:00 AM
              </Text>
              <View style={styles.aiRecommendation}>
                <Ionicons name="location" size={16} color="#3B82F6" />
                <Text style={[styles.aiRecommendText, { color: '#3B82F6' }]}>
                  Khuyến nghị: Do huyết áp sau khi thức dậy 30 phút và trước khi ăn sáng
                </Text>
              </View>
            </View>

            <View style={[styles.aiCard, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}>
              <Text style={styles.aiText}>
                Tuân thủ uống thuốc cần cải thiện
              </Text>
              <Text style={[styles.aiSubtext, { marginBottom: 8 }]}>
                Tỷ lệ uống thuốc đúng giờ: 0%
              </Text>
              <View style={styles.aiRecommendation}>
                <Ionicons name="location" size={16} color="#FF9800" />
                <Text style={[styles.aiRecommendText, { color: '#FF9800' }]}>
                  Khuyến nghị: Thiết lập thêm báo thức hoặc nhờ người thân nhắc nhở
                </Text>
              </View>
            </View>

            <Text style={styles.aiFooter}>
              🤖 Phân tích được tạo bởi AI dựa trên dữ liệu sức khỏe của bạn. Luôn tham khảo ý kiến bác sĩ cho quyết định quan trọng.
            </Text>
          </View>

          {/* Medication Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Thuốc hôm nay</Text>
            </View>

            <View style={styles.medicationList}>
              <View style={[styles.medicationRow, { backgroundColor: '#fff' }]}>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>Amlodipine 5mg</Text>
                  <Text style={styles.medicationTime}>7:00 AM - Sáng</Text>
                </View>
                <Text style={styles.checkMark}>✓</Text>
              </View>

              <View style={[styles.medicationRow, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#B6D5FA' }]}>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>Candesartan 8mg</Text>
                  <Text style={styles.medicationTime}>7:00 PM - Tối</Text>
                </View>
                <TouchableOpacity style={styles.takeNowButton}>
                  <Text style={styles.takeNowText}>Uống ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Weekly report (reusable component). Dashboard currently has no patient-specific data, so pass undefined to show fallback */}
          <WeeklyReportCard title="Báo cáo tuần này" fullOverview={fullOverviewData} bloodPressureData={bpForPatient} patientId={selectedPatient?._id} />

          {/* Family Dashboard placeholder */}
          <View style={styles.familyDashboard}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="users" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Bảng điều khiển gia đình</Text>
            </View>
            <Text style={styles.dashboardDesc}>
              Theo dõi sức khỏe người thân theo thời gian thực.
            </Text>
          </View>
        </>
      ) : (
        <>
          {/* Family User Interface */}
          {/* <View style={styles.familyGreetingCard}>
            <View style={styles.cardIconContainer}>
              <View style={[styles.cardIcon, { backgroundColor: '#3B82F6' }]}>
                <Feather name="shield" size={32} color="#fff" />
              </View>
            </View>
            <Text style={styles.familyName}>Mẹ Nguyễn Thị Lan</Text>
            <Text style={styles.familyStatus}>Tình trạng hôm nay: Tốt</Text>
          </View> */}

          {/* AI Health Analysis for Family */}
          {/* <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>AI Phân tích sức khỏe - Mẹ Nguyễn Thị Lan</Text>
            </View>
            
            <View style={[styles.aiCard, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}>
              <Text style={styles.aiText}>
                Tuân thủ uống thuốc cần cải thiện
              </Text>
              <Text style={[styles.aiSubtext, { marginBottom: 8 }]}>
                Tỷ lệ uống thuốc đúng giờ: 86%
              </Text>
              <View style={styles.aiRecommendation}>
                <Ionicons name="location" size={16} color="#FF9800" />
                <Text style={[styles.aiRecommendText, { color: '#FF9800' }]}>
                  Khuyến nghị: Thiết lập thêm báo thức hoặc nhờ người thân nhắc nhở
                </Text>
              </View>
            </View>

            <View style={[styles.aiCard, { backgroundColor: '#E8F5E8', borderColor: '#4CAF50' }]}>
              <Text style={styles.aiText}>
                Đo huyết áp đều đặn
              </Text>
              <Text style={[styles.aiSubtext, { marginBottom: 8 }]}>
                Bạn đã đo huyết áp đều đặn 7/7 ngày qua
              </Text>
              <View style={styles.aiRecommendation}>
                <Ionicons name="location" size={16} color="#4CAF50" />
                <Text style={[styles.aiRecommendText, { color: '#4CAF50' }]}>
                  Khuyến nghị: Hãy tiếp tục duy trì thời quen tốt này
                </Text>
              </View>
            </View>

            <Text style={styles.aiFooter}>
              🤖 Phân tích được tạo bởi AI dựa trên dữ liệu sức khỏe của bạn. Luôn tham khảo ý kiến bác sĩ cho quyết định quan trọng.
            </Text>
          </View> */}

          {/* Weekly report component (family view) - selector integrated inside card */}
          <WeeklyReportCard
            title="Báo cáo tuần này"
            fullOverview={fullOverviewData}
            bloodPressureData={bpForPatient}
            patientId={selectedPatient?._id}
            selectedPatient={selectedPatient}
            onOpenSelector={() => setShowPatientSelector(true)}
          />

          {/* Family Dashboard placeholder */}
          <View style={styles.familyDashboard}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="users" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Bảng điều khiển gia đình</Text>
            </View>
            {loadingRelatives ? (
              <Text style={styles.dashboardDesc}>Đang tải danh sách...</Text>
            ) : relatives.length > 0 ? (
              relatives.map((item, idx) => (
                <View key={item._id || idx} style={styles.familyCard}>
                  <View style={styles.familyAvatar}>
                    <Text style={styles.familyAvatarText}>
                      {item.patient?.fullName?.charAt(0)?.toUpperCase() || 'D'}
                    </Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.familyNameCard}>Tên: {item.patient?.fullName || '---'}</Text>
                    <Text style={styles.familyEmail}>Email: {item.patient?.email || '---'}</Text>
                    <Text style={styles.familyPhone}>Số điện thoại: {item.patient?.phoneNumber || '---'}</Text>
                    <View style={styles.familyActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleCallFamily(item.patient?.phoneNumber)}>
                        <Ionicons name="call" size={18} color="#3B82F6" />
                        <Text style={styles.actionText}>Gọi</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleMessageFamily(item.patient?.phoneNumber)}>
                        <Ionicons name="chatbubble" size={18} color="#3B82F6" />
                        <Text style={styles.actionText}>Nhắn tin</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.dashboardDesc}>
                Chưa có dữ liệu.
              </Text>
            )}
          </View>
        </>
      )}
        {/* Patient selector modal (inside ScrollView so it mounts within component tree) */}
        <Modal visible={showPatientSelector} animationType="slide" transparent onRequestClose={() => setShowPatientSelector(false)}>
          <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' }}>
            <View style={{ width:'90%', backgroundColor:'#fff', borderRadius:12, padding:16, maxHeight:'75%' }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <Text style={{ fontSize:18, fontWeight:'600' }}>Chọn người bệnh</Text>
                <TouchableOpacity onPress={() => setShowPatientSelector(false)}><Text style={{fontSize:18}}>✕</Text></TouchableOpacity>
              </View>

              <FlatList
                data={relatives}
                keyExtractor={it => it._id || it.email || Math.random().toString()}
                renderItem={({item}) => {
                  const p = item.patient ? item.patient : item;
                  return (
                    <TouchableOpacity
                      style={{ padding:12, borderBottomWidth:1, borderColor:'#eee', backgroundColor: selectedPatient?._id === (p._id || p.id) ? '#EBF4FF' : '#fff' }}
                      onPress={() => { setSelectedPatient({ _id: p._id || p.id, fullName: p.fullName || p.name, email: p.email }); setShowPatientSelector(false); }}
                    >
                      <Text style={{fontWeight:'700'}}>{p.fullName || p.name || 'Tên chưa cập nhật'}</Text>
                      <Text style={{color:'#9CA3AF', marginTop:6}}>{p.email || p.phone || p._id}</Text>
                      {p.dateOfBirth ? <Text style={{color:'#9CA3AF', marginTop:4}}>Sinh: {new Date(p.dateOfBirth).toLocaleDateString('vi-VN')}</Text> : null}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={{ padding:12, alignItems:'center' }}>
                    <Text style={{ color:'#6B7280' }}>Chưa có người bệnh</Text>
                  </View>
                )}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }} onPress={() => { setShowPatientSelector(false); setSelectedPatient(null); }}>
                  <Text style={{ color: '#6B7280' }}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginLeft: 10,
  },
  iconWrap: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBtn: {
    marginRight: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#F04438',
    borderRadius: 4,
  },
  profileBtn: {
    padding: 4,
  },
  notificationModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD600',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1E293B',
  },
  notificationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  notificationBtn2: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  notificationBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  greetingCard: {
    backgroundColor: '#F0F6FF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  familyGreetingCard: {
    backgroundColor: '#F0F6FF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  cardIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
  },
  familyName: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  familyStatus: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
  },
  bloodPressureInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    color: '#1E293B',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  recentReadings: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  recentTitle: {
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    fontSize: 16,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  readingDate: {
    fontSize: 13,
    color: '#64748B',
  },
  readingValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  medicationList: {
    gap: 8,
  },
  medicationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 2,
  },
  medicationTime: {
    fontSize: 13,
    color: '#64748B',
  },
  checkMark: {
    fontSize: 24,
    color: '#388E3C',
  },
  takeNowButton: {
    backgroundColor: '#B6D5FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  takeNowText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  familyDashboard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  dashboardDesc: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
  },
  reportList: {
    gap: 8,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 2,
  },
  reportSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  reportPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // AI Analysis Styles
  aiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  aiText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    marginBottom: 8,
  },
  aiSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  aiRecommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  aiRecommendText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  aiFooter: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    lineHeight: 16,
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  familyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  familyAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  familyNameCard: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 2,
  },
  familyEmail: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
  },
  familyPhone: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  familyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#B6D5FA',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  actionText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  packageBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  proIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  trialIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  packageText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default DashboardScreen;
