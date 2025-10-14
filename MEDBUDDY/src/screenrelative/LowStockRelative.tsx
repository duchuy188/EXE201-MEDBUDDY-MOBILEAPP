import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Medication {
  _id: string;
  name: string;
  form?: string;
  remainingQuantity?: number;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  times: any[];
  note?: string;
  createdAt?: string;
}

const LowStockRelative = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId, patientName } = route.params as any;
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStockMedications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token xác thực');
        return;
      }

      const response = await RelativePatientService.getPatientLowStockMedications(patientId, token);
      console.log('Low stock API response:', JSON.stringify(response, null, 2));
      
      // Handle response format: { success: true, data: [...] }
      const lowStockMedications = response.data || response;
      console.log('Parsed medications:', lowStockMedications);
      console.log('Medications length:', lowStockMedications?.length);
      setMedications(lowStockMedications);
    } catch (error) {
      console.error('Error fetching low stock medications:', error);
      Alert.alert('Lỗi', 'Không thể lấy danh sách thuốc sắp hết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockMedications();
  }, []);

  const handleSetThreshold = (medication: Medication) => {
    (navigation as any).navigate('SetThresholdRelative', { 
      medication,
      patientId,
      onSuccess: fetchLowStockMedications
    });
  };

  const handleAddStock = (medication: Medication) => {
    (navigation as any).navigate('AddStockRelative', { 
      medication,
      patientId,
      onSuccess: fetchLowStockMedications
    });
  };

  const renderMedicationItem = ({ item }: { item: Medication }) => (
    <View style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <MaterialIcons name="medication" size={24} color="#F59E0B" />
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{item.name}</Text>
          <Text style={styles.medicationForm}>
            {item.form || 'viên'} - Còn lại: {item.remainingQuantity || 0}
          </Text>
        </View>
      </View>
      
      <View style={styles.medicationDetails}>
        <Text style={styles.detailText}>
          Ngưỡng cảnh báo: {item.lowStockThreshold || 0} {item.form || 'viên'}
        </Text>
        {item.note && (
          <Text style={styles.detailText}>Ghi chú: {item.note}</Text>
        )}
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thuốc sắp hết</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Render - medications state:', medications);
  console.log('Render - medications length:', medications?.length);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thuốc sắp hết</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <MaterialIcons name="warning" size={32} color="#F59E0B" />
          <Text style={styles.summaryTitle}>
            {medications.length} thuốc sắp hết
          </Text>
          <Text style={styles.summarySubtitle}>
            Bệnh nhân: {patientName}
          </Text>
        </View>

        {medications.length > 0 ? (
          <FlatList
            data={medications}
            keyExtractor={(item) => item._id}
            renderItem={renderMedicationItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="check-circle" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>Tuyệt vời!</Text>
            <Text style={styles.emptySubtitle}>
              Không có thuốc nào sắp hết cho bệnh nhân này
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginTop: 8,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#92400E',
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontWeight: 'bold',
    color: '#1F2937',
  },
  medicationForm: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  medicationDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonGreen: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#06B6D4',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextGreen: {
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default LowStockRelative;
