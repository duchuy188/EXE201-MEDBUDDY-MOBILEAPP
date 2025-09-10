import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReminderService from '../api/Reminders';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define Reminder type
type Reminder = {
  _id: string;
  time: string;
  note?: string;
};

const AppointmentsScreen = ({ navigation }: any) => {
  // Add type definition for appointments
  const [appointments, setAppointments] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const data = await ReminderService.getReminders(token);
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const renderAppointment = ({ item }: any) => (
    <TouchableOpacity style={styles.appointmentCard}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={24} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.time}</Text>
          <Text style={styles.cardSubtitle}>{item.note || 'Không có ghi chú'}</Text>
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
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Không có cuộc hẹn nào</Text>
        </View>
      )}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddAppointment')}>
        <Text style={styles.addButtonText}>+ Tạo cuộc hẹn</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    bottom: 40, // Adjusted from 20 to 40 to move the button slightly up
    alignSelf: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentsScreen;
