import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import RelativePatientService from '../api/RelativePatient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HealthTrackingScreen = ({ navigation }: any) => {
  const [deleting, setDeleting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [relatives, setRelatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const patientsData = await RelativePatientService.getPatientsOfRelative(token);
        const relativesData = await RelativePatientService.getRelativesOfPatient(token);
        console.log('Full patients data:', JSON.stringify(patientsData, null, 2));
        console.log('Full relatives data:', JSON.stringify(relativesData, null, 2));
        setPatients(patientsData);
        setRelatives(relativesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const handleShowDetail = (user: any) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleDeleteRelative = async () => {
    if (!selectedUser || !selectedUser._id) return;
    setDeleting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token lấy từ local:', token); // Log để kiểm tra
      console.log('linkId (should be _id of RelativePatient):', selectedUser._id); // Log giá trị _id
      if (token) {
        await RelativePatientService.deleteRelativePatient(selectedUser._id, token);
        setModalVisible(false);
        fetchData();
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
      }
    } catch (error) {
      console.error('Error deleting relative:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Helper để lấy đúng object thông tin người thân
  const getUserInfo = (user: any) => {
    if (!user) return null;
    // Nếu có field 'relative', trả về user.relative, ngược lại trả về user
    return user.relative ? user.relative : user;
  };

  const renderUserCard = (user: any, type: 'patient' | 'relative') => {
    // Lấy đúng thông tin người thân để hiển thị tên
    const info = user.relative ? user.relative : user;
    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleShowDetail(user)}
      >
        <View style={styles.userAvatarContainer}>
          {info.avatar ? (
            <Image source={{ uri: info.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{info.fullName || (type === 'patient' ? 'Người bệnh' : 'Người thân')}</Text>
          <Text style={styles.userType}>
            {type === 'patient' ? 'Người bệnh' : 'Người thân'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7BA7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          // Navigate into the MainTabs navigator and open the "Thông tin cá nhân" tab
          onPress={() => navigation.navigate('MainTabs', { screen: 'Thông tin cá nhân' })}
        >
          <Ionicons name="arrow-back" size={24} color="#000000ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Người thân</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('AddRelative')}
        >
          <Ionicons name="add" size={24} color="#000000ff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {patients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách người bệnh</Text>
            {patients.map((patient: any, idx: number) => (
              <React.Fragment key={patient._id || patient.id || idx}>
                {renderUserCard(patient, 'patient')}
              </React.Fragment>
            ))}
          </View>
        )}

        {relatives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách người thân</Text>
            {relatives.map((relative: any, idx: number) => (
              <React.Fragment key={relative._id || relative.id || idx}>
                {renderUserCard(relative, 'relative')}
              </React.Fragment>
            ))}
          </View>
        )}

        {patients.length === 0 && relatives.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#999" />
            <Text style={styles.emptyStateText}>
              Chưa có người thân hoặc người bệnh nào được thêm
            </Text>
          </View>
        )}
      </ScrollView>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' }}
            onPress={() => {}}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Thông tin chi tiết</Text>
            {selectedUser && (
              <>
                {(() => {
                  const info = getUserInfo(selectedUser);
                  return (
                    <>
                      <Text style={{ fontSize: 16, marginBottom: 8 }}>Họ tên: {info?.fullName || 'Chưa có'}</Text>
                      <Text style={{ fontSize: 16, marginBottom: 8 }}>Email: {info?.email || 'Chưa có'}</Text>
                      <Text style={{ fontSize: 16, marginBottom: 8 }}>SĐT: {info?.phoneNumber || 'Chưa có'}</Text>
                      {info?.dateOfBirth && (
                        <Text style={{ fontSize: 16, marginBottom: 8 }}>
                          Ngày sinh: {(() => {
                            const date = new Date(info.dateOfBirth);
                            const day = date.getDate().toString().padStart(2, '0');
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const year = date.getFullYear();
                            return `${day}/${month}/${year}`;
                          })()}
                        </Text>
                      )}
                      <Text style={{ fontSize: 16, marginBottom: 8 }}>Vai trò: {info?.role === 'patient' ? 'Người bệnh' : 'Người thân'}</Text>
                    </>
                  );
                })()}
              </>
            )}
            <TouchableOpacity
              style={{ marginTop: 12, backgroundColor: '#EF4444', borderRadius: 8, padding: 12, alignItems: 'center' }}
              onPress={handleDeleteRelative}
              disabled={deleting}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                {deleting ? 'Đang xóa...' : 'Xóa người thân'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 16, backgroundColor: '#4A7BA7', borderRadius: 8, padding: 12, alignItems: 'center' }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Đóng</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#000000ff',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  userAvatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default HealthTrackingScreen;
