import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PackageService from '../api/Package'; // Sử dụng service đã viết
import { createPaymentLink, payosReturn, getPaymentInfo } from '../api/PayOS';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import RelativePatientService from '../api/RelativePatient';

// helper: format price to "xx.xxx VNĐ" or "Miễn phí"
const formatPrice = (value: number) => {
  if (!value || value === 0) return 'Miễn phí';
  return `${value.toLocaleString('vi-VN')} VNĐ`;
};

// helper: format duration + unit (display in Vietnamese)
const formatDuration = (duration: number, unit: string) => {
  if (!duration) return '';
  const u = (unit || '').toLowerCase();
  if (u.includes('day') || u.includes('ngày')) return `${duration} ngày`;
  if (u.includes('month') || u.includes('tháng')) return `${duration} ${duration > 1 ? 'tháng' : 'tháng'}`;
  if (u.includes('year') || u.includes('năm')) return `${duration} năm`;
  // fallback: return raw
  return `${duration} ${unit}`;
};

interface Package {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  unit: string;
  features: string[];
  __v: number;
  createdAt: string;
  updatedAt: string;
}

const PackageScreen = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(''); // Lấy token từ AsyncStorage hoặc context
  const [patients, setPatients] = useState<any[]>([]);
  const [showPatientSelectorForPayment, setShowPatientSelectorForPayment] = useState(false);
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<any | null>(null);
  const [pendingPackage, setPendingPackage] = useState<Package | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const route = useRoute();
  const navigation = useNavigation(); // <- add navigation (used in modal "Thêm người bệnh")
  const patientIdFromParams = (route as any)?.params?.userId || (route as any)?.params?.patientId || null;

  // Refresh handler used by FlatList refreshControl
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchPackages();
    } finally {
      setRefreshing(false);
    }
  }, [token]);
  
  // Hàm lấy danh sách gói
  const getAllPackages = async (authToken: string) => {
    try {
      const res = await PackageService.getAllPackages(authToken);
      return res; // PackageService đã trả về mảng data rồi
    } catch (error) {
      throw error;
    }
  };

  // Hàm fetch packages
  const fetchPackages = async () => {
    try {
      const userToken = token || 'YOUR_TOKEN_HERE';
      const data = await getAllPackages(userToken);
      setPackages(data); // data là mảng các package
    } catch (error: any) {
      console.error('Error fetching packages:', error);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể tải danh sách gói'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const getToken = async () => {
      const userToken = await AsyncStorage.getItem('token');
      setToken(userToken || '');
    };
    getToken();
  }, []);

  useEffect(() => {
    // fetch packages only after token is retrieved
    if (token) fetchPackages();
  }, [token]);
  
  // load patients for relative (used when choosing patient to pay for)
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
          phone: p?.phone || p?.phoneNumber || p?.phone_number || '',
          dateOfBirth: p?.dateOfBirth || p?.dob || p?.birthDate || '',
        };
      });
      setPatients(normalized);
    } catch (e) {
      console.log('Load patients error', e);
    } finally {
      setLoadingPatients(false);
    }
  };
  
  // Hàm kiểm tra kết quả thanh toán
  const checkPaymentResult = async () => {
    const userToken = await AsyncStorage.getItem('token');
    if (!userToken) return;
    try {
      const result = await payosReturn(userToken);
      console.log('[PayOS] payosReturn result:', result); // <-- Từ khóa dễ tìm
      if (result.status === 'PAID' && result.orderCode) {
        const info = await getPaymentInfo(result.orderCode, userToken);
        console.log('[PayOS] getPaymentInfo:', info); // <-- Từ khóa dễ tìm
        Alert.alert(
          'Thanh toán thành công',
          `Giao dịch #${info.orderCode} đã được xác nhận.`
        );
        fetchPackages();
      } else if (result.status === 'CANCELLED' || result.status === 'EXPIRED') {
        console.log('[PayOS] Payment cancelled or expired:', result.status); // <-- Từ khóa dễ tìm
        Alert.alert('Thanh toán thất bại', 'Giao dịch đã bị hủy hoặc hết hạn.');
      }
    } catch (error: any) {
      console.log('[PayOS] Error:', error); // <-- Từ khóa dễ tìm
    }
  };

  useEffect(() => {
    checkPaymentResult();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      console.log('[PayOS] Deep link event:', event.url); // Thêm log này để kiểm tra
      const url = event.url;
      const orderCodeMatch = url.match(/orderCode=([^&]+)/);
      const orderCode = orderCodeMatch ? orderCodeMatch[1] : null;

      if (orderCode) {
        try {
          const userToken = await AsyncStorage.getItem('token');
          const info = await getPaymentInfo(orderCode, userToken || '');
          console.log('[PayOS] getPaymentInfo from deep link:', info); // Thêm log này
          if (info.paymentInfo.status === 'PAID') {
            Alert.alert('Thanh toán thành công', `Giao dịch #${orderCode} đã được xác nhận.`);
            fetchPackages();
          } else if (
            info.paymentInfo.status === 'CANCELLED' ||
            info.paymentInfo.status === 'EXPIRED'
          ) {
            Alert.alert('Thanh toán thất bại', 'Giao dịch đã bị hủy hoặc hết hạn.');
          } else {
            Alert.alert('Thanh toán thất bại', 'Giao dịch chưa hoàn thành.');
          }
        } catch (error: any) {
          console.log('[PayOS] Deep link error:', error); // Thêm log này
          Alert.alert('Thanh toán thất bại', 'Không kiểm tra được trạng thái giao dịch.');
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  // modify handleSelectPackage: open patient selector when choosing paid package
  const handleSelectPackage = async (item: Package) => {
    try {
      const userToken = token || (await AsyncStorage.getItem('token')) || '';
      if (item.price === 0) {
        if (PackageService.activateTrialPackage) {
          const res = await PackageService.activateTrialPackage(item._id, userToken);
          Alert.alert('Thành công', res.message || 'Đã kích hoạt gói dùng thử!');
          fetchPackages();
        } else {
          Alert.alert('Lỗi', 'API kích hoạt gói dùng thử chưa được khai báo');
        }
        return;
      }

      // for paid packages: load patients first, then open selector modal
      await loadPatients(userToken);
      setPendingPackage(item);
      setShowPatientSelectorForPayment(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể kích hoạt hoặc thanh toán');
    }
  };
  
  // called after user picks a patient in modal
  const confirmPurchaseForPatient = async () => {
    if (!pendingPackage) return;
    if (!selectedPatientForPayment?._id) {
      Alert.alert('Vui lòng chọn người bệnh');
      return;
    }
    try {
      const userToken = token || 'YOUR_TOKEN_HERE';
      const payload = { packageId: pendingPackage._id };
      const res = await RelativePatientService.createPaymentLinkForPatient(selectedPatientForPayment._id, payload, userToken);
      setShowPatientSelectorForPayment(false);
      setPendingPackage(null);
      setSelectedPatientForPayment(null);

      if (res?.paymentUrl) {
        Linking.openURL(res.paymentUrl);
      } else {
        Alert.alert('Lỗi', 'Không tạo được link thanh toán');
      }
    } catch (error: any) {
      console.log('Create payment link error', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo link thanh toán');
    }
  };

  // Render item
  const renderPackageItem = ({ item }: { item: Package }) => {
    // Nếu là gói nâng cao thì hiển thị giá gốc
    const isSale = item.name.includes('NÂNG CAO');
    const originalPrice = 228000;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.packageName}>{item.name}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            {isSale && (
              <Text style={styles.originalPrice}>
                {originalPrice.toLocaleString('vi-VN')} VNĐ
              </Text>
            )}
            <Text style={styles.packagePrice}>
              {item.price === 0 ? 'Miễn phí' : formatPrice(item.price)}
            </Text>
          </View>
        </View>

        <Text style={styles.packageDescription}>{item.description}</Text>

        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>Thời hạn: </Text>
          <Text style={styles.durationValue}>
            {formatDuration(item.duration, item.unit)}
          </Text>
        </View>

        {item.features && item.features.length > 0 && (
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Tính năng:</Text>
            {item.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                • {feature}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => handleSelectPackage(item)}
        >
          <Text style={styles.selectButtonText}>Chọn gói</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gói dịch vụ</Text>
      <FlatList
        data={packages}
        renderItem={renderPackageItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có gói dịch vụ nào</Text>
          </View>
        }
      />
      <Modal visible={showPatientSelectorForPayment} animationType="slide" transparent onRequestClose={() => {
        setShowPatientSelectorForPayment(false);
        setPendingPackage(null);
        setSelectedPatientForPayment(null);
      }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '90%', maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>Thanh toán cho người bệnh</Text>
              <TouchableOpacity onPress={() => { setShowPatientSelectorForPayment(false); setPendingPackage(null); }}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
            </View>

            {loadingPatients ? (
              <ActivityIndicator />
            ) : (
              <FlatList
                data={patients}
                keyExtractor={(it) => it._id || it.email || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: selectedPatientForPayment?._id === item._id ? '#EBF4FF' : '#fff' }}
                    onPress={() => setSelectedPatientForPayment(item)}
                  >
                    <Text style={{ fontWeight: '700', color: '#111' }}>{item.fullName || 'Tên chưa cập nhật'}</Text>
                    <Text style={{ color: '#9CA3AF', marginTop: 6 }}>{item.email || ''}</Text>
                    <Text style={{ color: '#9CA3AF', marginTop: 2 }}>{item.phone || ''}</Text>
                    {item.dateOfBirth ? <Text style={{ color: '#9CA3AF', marginTop: 2 }}>Sinh: {new Date(item.dateOfBirth).toLocaleDateString('vi-VN')}</Text> : null}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#6B7280' }}>Chưa có người bệnh</Text>
                    <TouchableOpacity style={{ marginTop: 12, backgroundColor: '#4A7BA7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }} onPress={() => {
                      setShowPatientSelectorForPayment(false);
                      // @ts-ignore
                      navigation.navigate('AddRelative');
                    }}>
                      <Text style={{ color: '#fff' }}>+ Thêm người bệnh mới</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }} onPress={() => { setShowPatientSelectorForPayment(false); setPendingPackage(null); setSelectedPatientForPayment(null); }}>
                <Text style={{ color: '#6B7280' }}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }} onPress={confirmPurchaseForPatient}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Thanh toán</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    flex: 1,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 2, // đổi từ marginRight sang marginBottom
    textAlign: 'right',
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  durationContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  durationLabel: {
    fontSize: 14,
    color: '#666',
  },
  durationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  featuresContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default PackageScreen;