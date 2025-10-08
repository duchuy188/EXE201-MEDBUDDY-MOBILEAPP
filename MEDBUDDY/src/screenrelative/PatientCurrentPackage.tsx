import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RelativePatientService from '../api/RelativePatient';
import { LinearGradient } from 'expo-linear-gradient';

const PatientCurrentPackage = ({ navigation, route }: any) => {
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const routePatientId = route?.params?.patientId || route?.params?.userId || null;

  // Fetch thông tin gói hiện tại
  const fetchCurrentPackage = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        alert('Không tìm thấy token, vui lòng đăng nhập lại!');
        return;
      }

      // Prefer patientId from route (AppSettingsRelative passes it). If not present, try AsyncStorage userId.
      let patientId = routePatientId;
      if (!patientId) {
        patientId = await AsyncStorage.getItem('userId');
      }

      if (!patientId) {
        alert('Không tìm thấy userId của người bệnh.');
        setPackageData(null);
        return;
      }

      const response = await RelativePatientService.getPatientActivePackage(patientId, token);
      // response expected shape: { message, hasActivePackage, data }
      if (response?.hasActivePackage) {
        setPackageData(response.data);
      } else {
        setPackageData(null);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải gói hiện tại:', error);
      alert('Không thể tải thông tin gói dịch vụ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCurrentPackage();
  }, []);

  // Ensure navigator header shows desired title (we removed in-component header)
  useEffect(() => {
    navigation.setOptions({ title: 'Gói dịch vụ của tôi' });
  }, [navigation]);

  // Xử lý pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchCurrentPackage();
  };

  // Format giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Tính phần trăm thời gian đã sử dụng
  const calculateProgress = () => {
    if (!packageData) return 0;
    const start = new Date(packageData.startDate).getTime();
    const end = new Date(packageData.endDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const used = now - start;
    return Math.min(Math.max((used / total) * 100, 0), 100);
  };

  return (
    <View style={styles.container}>
      {/* Header provided by navigator (in-component header removed) */}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : !packageData ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có gói dịch vụ active</Text>
          <Text style={styles.emptySubText}>
            Nâng cấp tài khoản để trải nghiệm đầy đủ tính năng
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('PackageScreen')}
          >
            <Text style={styles.upgradeButtonText}>Nâng cấp ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Package Card */}
          <LinearGradient
            colors={['#2563eb', '#1e40af']}
            style={styles.packageCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.packageHeader}>
              <View>
                <Text style={styles.packageLabel}>GÓI HIỆN TẠI</Text>
                <Text style={styles.packageName}>{packageData.package.name}</Text>
              </View>
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.activeBadgeText}>Đang hoạt động</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Giá trị gói</Text>
              <Text style={styles.priceValue}>
                {formatPrice(packageData.package.price)}
              </Text>
            </View>
          </LinearGradient>

          {/* Thời gian sử dụng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian sử dụng</Text>
            
            <View style={styles.timeInfo}>
              <View style={styles.timeRow}>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.timeLabel}>Ngày bắt đầu</Text>
                  <Text style={styles.timeValue}>{packageData.formattedStartDate}</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={20} color="#6b7280" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.timeLabel}>Ngày hết hạn</Text>
                  <Text style={styles.timeValue}>{packageData.formattedEndDate}</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="hourglass-outline" size={20} color="#6b7280" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.timeLabel}>Thời gian còn lại</Text>
                  <Text style={[styles.timeValue, { color: '#2563eb', fontWeight: '700' }]}>
                    {packageData.daysRemaining} ngày
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tính năng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tính năng đang sử dụng</Text>
            <View style={styles.featuresContainer}>
              {packageData.features.map((feature: string, index: number) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('PackageScreen')}
            >
              <Ionicons name="arrow-up-circle-outline" size={24} color="#2563eb" />
              <Text style={styles.actionButtonText}>Nâng cấp gói cho người bệnh</Text>
            </TouchableOpacity>


          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
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
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 24,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  packageCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  packageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93c5fd',
    letterSpacing: 1,
    marginBottom: 4,
  },
  packageName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  priceContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  priceLabel: {
    fontSize: 13,
    color: '#93c5fd',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  timeInfo: {
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'right',
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 12,
  },
});

export default PatientCurrentPackage;