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
import userPackageService, { PackageHistory } from '../api/UserPackage';

const PackageHistoryScreen = ({ navigation }: any) => {
  const [history, setHistory] = useState<PackageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dữ liệu lịch sử
  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        alert('Không tìm thấy token, vui lòng đăng nhập lại!');
        return;
      }

      const response = await userPackageService.getMyPackageHistory(token);
      setHistory(response.data || []);
    } catch (error: any) {
      console.error('Lỗi khi tải lịch sử gói:', error);
      alert('Không thể tải lịch sử gói dịch vụ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Xử lý pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Format giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Format thời hạn (hỗ trợ cả singular/plural từ backend: day/days, month/months, year/years)
  const formatDuration = (duration: number, unit: string) => {
    if (!duration) return '';
    const u = (unit || '').toLowerCase();
    if (u.includes('day')) return `${duration} ngày`;
    if (u.includes('month')) return `${duration} tháng`;
    if (u.includes('year') || u.includes('năm')) return `${duration} năm`;
    // fallback: show raw unit
    return `${duration} ${unit}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
            <Text style={{ color: '#1a1a1a', marginLeft: 4, fontWeight: '500' }}>
              Quay lại
            </Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
        </View>
        <View style={{ width: 80 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có lịch sử thanh toán</Text>
          <Text style={styles.emptySubText}>
            Các giao dịch của bạn sẽ hiển thị tại đây
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {history.map((item, index) => (
            <View key={index} style={styles.historyCard}>
              {/* Header card */}
              <View style={styles.cardHeader}>
                <View style={styles.packageBadge}>
                  <Ionicons name="cube-outline" size={16} color="#2563eb" />
                  <Text style={styles.packageName}>{item.package.name}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              {/* Chi tiết gói */}
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
                  <Text style={styles.infoValue}>{item.orderCode}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Thời hạn:</Text>
                  <Text style={styles.infoValue}>
                    {formatDuration(item.package.duration, item.package.unit)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày thanh toán:</Text>
                  <Text style={styles.infoValue}>{item.formattedPaidAt}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                  <Text style={styles.totalValue}>{formatPrice(item.amount)}</Text>
                </View>
              </View>

              {/* Features */}
              {item.package.features && item.package.features.length > 0 && (
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Tính năng:</Text>
                  {item.package.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  featuresContainer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#4b5563',
    marginLeft: 8,
  },
});

export default PackageHistoryScreen;