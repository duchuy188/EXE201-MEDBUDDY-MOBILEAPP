import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import MedicationService from '../api/Medication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Medication {
  _id: string;
  name: string;
  form?: string;
  remainingQuantity?: number;
  lowStockThreshold?: number;
  isLowStock?: boolean;
}

const LowStockScreen = () => {
  const navigation = useNavigation();
  const [lowStockMedications, setLowStockMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLowStockMedications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      
      const medications = await MedicationService.getLowStockMedications(token);
      
      // Filter medications that are actually low stock (remaining <= threshold)
      const actuallyLowStock = medications.filter((med: any) => 
        med.remainingQuantity <= med.lowStockThreshold
      );
      
      setLowStockMedications(actuallyLowStock);
    } catch (error) {
      console.error('Error fetching low stock medications:', error);
      Alert.alert('Lỗi', 'Không thể lấy danh sách thuốc sắp hết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLowStockMedications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLowStockMedications();
  };

  const handleSetThreshold = (medication: Medication) => {
    (navigation as any).navigate('SetThreshold', { 
      medication,
      onSuccess: fetchLowStockMedications
    });
  };

  const handleAddStock = (medication: Medication) => {
    (navigation as any).navigate('AddStock', { 
      medication,
      onSuccess: fetchLowStockMedications
    });
  };

  const renderMedicationItem = ({ item }: { item: Medication }) => (
    <View style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <MaterialIcons name="medication" size={24} color="#3B82F6" />
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{item.name}</Text>
          <Text style={styles.medicationForm}>{item.form || 'Chưa có'}</Text>
        </View>
        <View style={styles.stockInfo}>
          <Text style={styles.stockText}>
            Còn: {item.remainingQuantity || 0}
          </Text>
          <Text style={styles.thresholdText}>
            Ngưỡng: {item.lowStockThreshold || 0}
          </Text>
        </View>
      </View>
      
      <View style={styles.warningSection}>
        <MaterialIcons name="warning" size={20} color="#F59E0B" />
        <Text style={styles.warningText}>
          Thuốc sắp hết! Còn {item.remainingQuantity || 0} {item.form || ''} 
          (ngưỡng: {item.lowStockThreshold || 0})
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleSetThreshold(item)}
        >
          <MaterialIcons name="settings" size={20} color="#06B6D4" />
          <Text style={styles.actionButtonText}>Đặt ngưỡng</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButtonGreen}
          onPress={() => handleAddStock(item)}
        >
          <MaterialIcons name="add-shopping-cart" size={20} color="#10B981" />
          <Text style={styles.actionButtonTextGreen}>Mua thêm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="check-circle" size={64} color="#10B981" />
      <Text style={styles.emptyStateTitle}>Tuyệt vời!</Text>
      <Text style={styles.emptyStateText}>
        Không có thuốc nào sắp hết. Tất cả thuốc đều đủ số lượng.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thuốc sắp hết</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thuốc sắp hết</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {lowStockMedications.length > 0 ? (
          <>
            <View style={styles.summaryCard}>
              <MaterialIcons name="warning" size={24} color="#F59E0B" />
              <Text style={styles.summaryText}>
                Có {lowStockMedications.length} loại thuốc sắp hết cần chú ý
              </Text>
            </View>
            
            <FlatList
              data={lowStockMedications}
              keyExtractor={(item) => item._id}
              renderItem={renderMedicationItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#3B82F6']}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#92400E',
    marginLeft: 12,
    flex: 1,
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  medicationForm: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  thresholdText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#A7D9FF',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonGreen: {
    flex: 1,
    backgroundColor: '#A7F3D0',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#06B6D4',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonTextGreen: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default LowStockScreen;
