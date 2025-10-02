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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PackageService from '../api/Package'; // Sử dụng service đã viết
import { createPaymentLink, payosReturn, getPaymentInfo } from '../api/PayOS';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

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
    fetchPackages();
  }, []);

  // Hàm refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPackages();
  };

  // Format giá tiền
  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' VNĐ';
  };

  // Format thời hạn
  const formatDuration = (duration: number, unit: string) => {
    const unitMap: { [key: string]: string } = {
      day: 'ngày',
      month: 'tháng',
      year: 'năm',
    };
    let extra = '';
    if (unit === 'month') extra = ' (30 ngày)';
    if (unit === 'year') extra = ' (365 ngày)';
    return `${duration} ${unitMap[unit] || unit}${extra}`;
  };

  // Render item
  const renderPackageItem = ({ item }: { item: Package }) => {
    // Nếu là gói nâng cao thì hiển thị giá gốc
    const isSale = item.name.includes('NÂNG CAO');
    const originalPrice = 228000;

    const handleSelectPackage = async () => {
      try {
        const userToken = token || 'YOUR_TOKEN_HERE';
        if (item.price === 0) {
          // Gói miễn phí: gọi API kích hoạt
          if (PackageService.activateTrialPackage) {
            const res = await PackageService.activateTrialPackage(item._id, userToken);
            Alert.alert('Thành công', res.message || 'Đã kích hoạt gói dùng thử!');
            fetchPackages();
          } else {
            Alert.alert('Lỗi', 'API kích hoạt gói dùng thử chưa được khai báo');
          }
        } else {
          // Gói trả phí: tạo link thanh toán
          const res = await createPaymentLink(item._id, userToken);
          if (res.paymentUrl) {
            Linking.openURL(res.paymentUrl);
          } else {
            Alert.alert('Lỗi', 'Không tạo được link thanh toán');
          }
        }
      } catch (error: any) {
        Alert.alert(
          'Lỗi',
          error.response?.data?.message || 'Không thể kích hoạt hoặc thanh toán'
        );
      }
    };

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
          onPress={handleSelectPackage}
        >
          <Text style={styles.selectButtonText}>Chọn gói</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
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
      checkPaymentResult();
    }, [])
  );

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
      {/* <TouchableOpacity
        style={[styles.selectButton, { backgroundColor: '#FF9500', marginBottom: 8 }]}
        onPress={async () => {
          const userToken = await AsyncStorage.getItem('token');
          if (!userToken) return;
          try {
            const result = await payosReturn(userToken);
            console.log('[PayOS] Manual check result:', result);
            if (result.status === 'PAID' && result.orderCode) {
              const info = await getPaymentInfo(result.orderCode, userToken);
              Alert.alert(
                'Thanh toán thành công',
                `Giao dịch #${info.orderCode} đã được xác nhận.`
              );
              fetchPackages();
            } else if (result.status === 'CANCELLED' || result.status === 'EXPIRED') {
              Alert.alert('Thanh toán thất bại', 'Giao dịch đã bị hủy hoặc hết hạn.');
            }
          } catch (error: any) {
            console.log('[PayOS] Manual check error:', error);
          }
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kiểm tra trạng thái giao dịch</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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