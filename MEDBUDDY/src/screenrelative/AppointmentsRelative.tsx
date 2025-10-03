import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, RefreshControl } from 'react-native';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppointmentsService from '../api/Appointments';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define Appointment type
type Appointment = {
  _id: string;
  title: string;
  hospital: string;
  location: string;
  date: string;
  time: string;
  notes?: string;
  status: string;
};

const AppointmentsRelative = ({ navigation }: any) => {
  // Add type definition for appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAppointments().then(() => setRefreshing(false));
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Current token:', token);
      
      if (token) {
        console.log('Fetching appointments...');
        const response = await AppointmentsService.getAppointments(token);
        console.log('Full API response:', JSON.stringify(response, null, 2));
        
        // Kiểm tra cấu trúc response
        if (response) {
          if (Array.isArray(response)) {
            console.log('Response is an array, setting directly');
            setAppointments(response);
          } else if (response.data && Array.isArray(response.data)) {
            console.log('Response has data array, setting from data');
            setAppointments(response.data);
          } else if (response.appointments && Array.isArray(response.appointments)) {
            console.log('Response has appointments array, setting from appointments');
            setAppointments(response.appointments);
          } else {
            console.log('Invalid response structure:', response);
            setAppointments([]);
          }
        } else {
          console.log('No response data');
          setAppointments([]);
        }
      } else {
        console.log('No token found');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        // @ts-ignore
        if (error.response) {
          // @ts-ignore
          console.error('Error response:', error.response.data);
          // @ts-ignore
          console.error('Error status:', error.response.status);
        }
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => {
        setSelectedAppointment(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={24} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>Bệnh viện: {item.hospital}</Text>
          <Text style={styles.cardSubtitle}>Địa điểm: {item.location}</Text>
          <Text style={styles.cardSubtitle}>Ngày: {new Date(item.date).toLocaleDateString()} - Giờ: {item.time}</Text>
          <Text style={styles.cardSubtitle}>Ghi chú: {item.notes || 'Không có ghi chú'}</Text>
          <Text style={styles.cardSubtitle}>Trạng thái: {item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
      ) : appointments.length > 0 ? (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Không có cuộc hẹn nào</Text>
        </View>
      )}
      <TouchableOpacity style={styles.addButton} onPress={async () => {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');
        navigation.navigate('AddAppointment', { token, userId });
      }}>
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Thêm lịch tái khám</Text>
      </TouchableOpacity>

      {/* Modal chi tiết cuộc hẹn */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedAppointment && (
              <React.Fragment>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Ionicons name="calendar" size={48} color="#2563EB" />
                </View>
                <Text style={styles.modalTitle}>{selectedAppointment.title}</Text>
                <View style={styles.modalRow}>
                  <Ionicons name="business" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Bệnh viện: {selectedAppointment.hospital}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="location" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Địa điểm: {selectedAppointment.location}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="calendar" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Ngày: {new Date(selectedAppointment.date).toLocaleDateString()} - Giờ: {selectedAppointment.time}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="document-text" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Ghi chú: {selectedAppointment.notes || 'Không có ghi chú'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="alert-circle" size={20} color="#2563EB" style={styles.modalIcon}/>
                  <Text style={styles.modalText}>Trạng thái: {selectedAppointment.status}</Text>
                </View>
                <View style={styles.modalActions}>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity style={styles.modalActionBtn} onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={28} color="#2563EB" />
                    </TouchableOpacity>
                    <Text style={{ color: '#2563EB', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Đóng</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={async () => {
                        if (!selectedAppointment) return;
                        const token = await AsyncStorage.getItem('token');
                        if (!token) return;
                        try {
                          await AppointmentsService.deleteAppointment(selectedAppointment._id, token);
                          setModalVisible(false);
                          setSelectedAppointment(null);
                          fetchAppointments();
                        } catch (error) {
                          console.error('Error deleting appointment:', error);
                        }
                      }}
                    >
                      <Ionicons name="trash" size={28} color="#EF4444" />
                    </TouchableOpacity>
                    <Text style={{ color: '#EF4444', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Xóa</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={async () => {
                        if (!selectedAppointment) return;
                        const token = await AsyncStorage.getItem('token');
                        const userId = await AsyncStorage.getItem('userId');
                        setModalVisible(false);
                        navigation.navigate('EditAppointment', {
                          appointment: selectedAppointment,
                          token,
                          userId,
                        });
                      }}
                    >
                      <Ionicons name="pencil" size={28} color="#2563EB" />
                    </TouchableOpacity>
                    <Text style={{ color: '#2563EB', marginTop: 4, fontWeight: '500', fontSize: 14 }}>Chỉnh sửa</Text>
                  </View>
                </View>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
  },
  modalActionBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 32,
    padding: 12,
    marginHorizontal: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4A7BA7',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  appointmentCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff', 
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalIcon: {
    marginRight: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
});

export default AppointmentsRelative;
