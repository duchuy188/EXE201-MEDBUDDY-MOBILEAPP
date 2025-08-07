import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Ionicons, 
  MaterialIcons, 
  FontAwesome5, 
  FontAwesome, 
  Feather 
} from '@expo/vector-icons';

interface DashboardScreenProps {
  userType: 'patient' | 'family';
  onLogout?: () => void;
}

  const DashboardScreen: React.FC<DashboardScreenProps> = ({ userType, onLogout }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [showNotification, setShowNotification] = useState(false);

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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient 
          colors={["#3B82F6", "#60A5FA"]} 
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>
                {userType === 'patient' ? 'Chào buổi sáng!' : 'Theo dõi người thân'}
              </Text>
              <Text style={styles.subtitle}>
                {userType === 'patient' ? 'Hôm nay bạn cảm thấy thế nào?' : 'Tình trạng sức khỏe của mẹ'}
              </Text>
            </View>
            <View style={styles.headerIcons}>
              {userType === 'patient' && (
                <TouchableOpacity
                  style={styles.notificationBtn}
                  onPress={() => setShowNotification(!showNotification)}
                >
                  <Ionicons name="notifications" size={24} color="#FFD600" />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onLogout} style={styles.profileBtn}>
                <Ionicons name="person-circle" size={28} color="#fff" />
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
                Tỷ lệ uống thuốc đúng giờ: 86%
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

          {/* Family Dashboard placeholder */}
          <View style={styles.familyDashboard}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="users" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Dashboard gia đình (demo)</Text>
            </View>
            <Text style={styles.dashboardDesc}>
              Theo dõi sức khỏe người thân theo thời gian thực.
            </Text>
          </View>
        </>
      ) : (
        <>
          {/* Family User Interface */}
          <View style={styles.familyGreetingCard}>
            <View style={styles.cardIconContainer}>
              <View style={[styles.cardIcon, { backgroundColor: '#3B82F6' }]}>
                <Feather name="shield" size={32} color="#fff" />
              </View>
            </View>
            <Text style={styles.familyName}>Mẹ Nguyễn Thị Lan</Text>
            <Text style={styles.familyStatus}>Tình trạng hôm nay: Tốt</Text>
          </View>

          {/* AI Health Analysis for Family */}
          <View style={styles.card}>
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
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="heartbeat" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Báo cáo tuần này</Text>
            </View>

            <View style={styles.reportList}>
              <View style={[styles.reportRow, { backgroundColor: '#E8F5E8' }]}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>Uống thuốc đúng giờ</Text>
                  <Text style={styles.reportSubtitle}>6/7 ngày</Text>
                </View>
                <Text style={[styles.reportPercentage, { color: '#388E3C' }]}>86%</Text>
              </View>

              <View style={[styles.reportRow, { backgroundColor: '#E0F7FA' }]}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>Đo huyết áp</Text>
                  <Text style={styles.reportSubtitle}>7/7 ngày</Text>
                </View>
                <Text style={[styles.reportPercentage, { color: '#009688' }]}>100%</Text>
              </View>

              <View style={[styles.reportRow, { backgroundColor: '#F0F6FF' }]}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>Huyết áp trung bình</Text>
                  <Text style={styles.reportSubtitle}>Tuần này</Text>
                </View>
                <Text style={[styles.reportPercentage, { color: '#3B82F6' }]}>125/82</Text>
              </View>
            </View>
          </View>

          {/* Family Dashboard placeholder */}
          <View style={styles.familyDashboard}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="users" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Dashboard gia đình</Text>
            </View>
            <Text style={styles.dashboardDesc}>
              Theo dõi sức khỏe người thân theo thời gian thực.
            </Text>
          </View>
        </>
      )}
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
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default DashboardScreen;
