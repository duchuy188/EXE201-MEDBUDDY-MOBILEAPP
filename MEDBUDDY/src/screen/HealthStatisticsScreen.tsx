import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from "react-native";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { PieChart, LineChart } from 'react-native-chart-kit';
import BloodPressureService from '../api/bloodPressure';
import MedicationService, { WeeklyOverview, FullOverview } from '../api/medicationsHistory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useFocusEffect } from '@react-navigation/native';

const medicineComplianceData = [
  { day: "T2", taken: 0, missed: 0, total: 2 },
  { day: "T3", taken: 0, missed: 0, total: 2 },
  { day: "T4", taken: 0, missed: 0, total: 2 },
  { day: "T5", taken: 0, missed: 0, total: 2 },
  { day: "T6", taken: 0, missed: 0, total: 2 },
  { day: "T7", taken: 0, missed: 0, total: 2 },
  { day: "CN", taken: 0, missed: 0, total: 2 }
];

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'bloodpressure', label: 'Huyết áp' },
  { key: 'medicine', label: 'Thuốc' },
];

const HealthStatisticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bloodPressureData, setBloodPressureData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOverview | null>(null);
  const [fullOverview, setFullOverview] = useState<FullOverview | null>(null);
  const route = useRoute();

  // token and userId may come from navigation params or AsyncStorage
  const [token, setToken] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  // Load credentials from route params or AsyncStorage on mount
  useEffect(() => {
    const init = async () => {
      try {
        // @ts-ignore
        const paramToken = route.params?.token;
        // @ts-ignore
        const paramUserId = route.params?.userId;

        if (paramToken && paramToken !== 'undefined') setToken(paramToken);
        if (paramUserId && paramUserId !== 'undefined') setUserId(paramUserId);

        // If either is missing, try AsyncStorage
        if ((!paramToken || paramToken === 'undefined') || (!paramUserId || paramUserId === 'undefined')) {
          const storedToken = await AsyncStorage.getItem('token');
          const storedUserId = await AsyncStorage.getItem('userId');
          if (!paramToken && storedToken) setToken(storedToken);
          if (!paramUserId && storedUserId) setUserId(storedUserId);
        }
      } catch (e) {
        console.error('Failed to load credentials from AsyncStorage', e);
      }
    };
    init();
  }, [route.params]);

  // When token and userId become available, fetch data
  useEffect(() => {
    if (!token || !userId) return;
    fetchAllData();
  }, [token, userId]);

  // Also refresh data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const refresh = async () => {
        try {
          const currentToken = token || await AsyncStorage.getItem('token') || '';
          const currentUserId = userId || await AsyncStorage.getItem('userId') || '';
          if (currentToken && currentUserId && isActive) {
            await fetchAllData();
          }
        } catch (e) {
          console.error('Error refreshing data on focus', e);
        }
      };
      refresh();
      return () => { isActive = false; };
    }, [token, userId])
  );

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBloodPressureData(),
        fetchMedicationData()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodPressureData = async () => {
    try {
      // ensure we have a token (try AsyncStorage as fallback)
      const currentToken = token || await AsyncStorage.getItem('token') || '';
      if (!currentToken) {
        console.warn('No token available for fetching blood pressure data');
        return;
      }
      console.log('Fetching blood pressure with token:', currentToken ? '***' : '(empty)');
      const data = await BloodPressureService.getBloodPressureHistory(currentToken);
      const recentData = (data || []).slice(0, 7);
      setBloodPressureData(recentData);
    } catch (error) {
      console.error('Failed to fetch blood pressure data:', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu huyết áp.');
    }
  };

  const fetchMedicationData = async () => {
    try {
      // ensure we have token and userId (fallback to AsyncStorage)
      const currentToken = token || await AsyncStorage.getItem('token') || '';
      const currentUserId = userId || await AsyncStorage.getItem('userId') || '';
      if (!currentToken || !currentUserId) {
        console.warn('Missing token/userId for medication data fetch', { currentToken: !!currentToken, currentUserId: !!currentUserId });
        return;
      }
      console.log('Fetching medication data for user:', currentUserId);
      const [weekly, full] = await Promise.all([
        MedicationService.getWeeklyOverview(currentUserId, currentToken),
        MedicationService.getFullOverview(currentUserId, currentToken)
      ]);
      
      // Debug: Log dữ liệu thực tế từ API
      console.log('Weekly Overview from API:', JSON.stringify(weekly, null, 2));
      console.log('Full Overview from API:', JSON.stringify(full, null, 2));
      
      setWeeklyOverview(weekly);
      setFullOverview(full);
    } catch (error) {
      console.error('Failed to fetch medication data:', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu thuốc.');
    }
  };

  // Get pie chart data from API
  const getPieChartData = () => {
    if (!weeklyOverview || !weeklyOverview.summary) {
      // fallback data
      return [
        { name: "Uống đúng giờ", value: 85, color: "#10b981" },
        { name: "Uống muộn", value: 10, color: "#f59e0b" },
        { name: "Bỏ lỡ", value: 5, color: "#ef4444" }
      ];
    }
    
    // Tính từ fullOverview stats
    if (fullOverview?.stats) {
      const stats = fullOverview.stats;
      const total = stats.total;
      
      return [
        { 
          name: "Uống đúng giờ", 
          value: total > 0 ? Math.round((stats.on_time / total) * 100) : 0, 
          color: "#10b981" 
        },
        { 
          name: "Uống muộn", 
          value: total > 0 ? Math.round((stats.late / total) * 100) : 0, 
          color: "#f59e0b" 
        },
        { 
          name: "Bỏ lỡ", 
          value: total > 0 ? Math.round((stats.missed / total) * 100) : 0, 
          color: "#ef4444" 
        }
      ];
    }
    
    // Fallback
    return [
      { name: "Uống đúng giờ", value: 85, color: "#10b981" },
      { name: "Uống muộn", value: 10, color: "#f59e0b" },
      { name: "Bỏ lỡ", value: 5, color: "#ef4444" }
    ];
  };

  // Calculate average blood pressure from recent data
  const getAverageBloodPressure = () => {
    if (!bloodPressureData || bloodPressureData.length === 0) {
      return "0/0"; // fallback
    }
    
    const totalSystolic = bloodPressureData.reduce((sum, item) => sum + (item.systolic || 0), 0);
    const totalDiastolic = bloodPressureData.reduce((sum, item) => sum + (item.diastolic || 0), 0);
    
    const avgSystolic = Math.round(totalSystolic / bloodPressureData.length);
    const avgDiastolic = Math.round(totalDiastolic / bloodPressureData.length);
    
    return `${avgSystolic}/${avgDiastolic}`;
  };

  // Calculate compliance percentage
  const getCompliancePercentage = () => {
    if (!fullOverview?.adherenceRate) return 0; // fallback
    return Math.round(fullOverview.adherenceRate);
  };

  // Convert daily breakdown to display format - FIX chính
  const getDailyStatsFromAPI = () => {
    if (!weeklyOverview?.medications || weeklyOverview.medications.length === 0) {
      return medicineComplianceData; // fallback
    }

    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const dailyStats = [];

    for (const dayName of dayNames) {
      let totalTaken = 0;
      let totalMissed = 0;

      // Lặp qua từng medication
      weeklyOverview.medications.forEach(med => {
        if (med.dailyBreakdown && med.dailyBreakdown[dayName]) {
          totalTaken += med.dailyBreakdown[dayName].taken || 0;
          totalMissed += med.dailyBreakdown[dayName].missed || 0;
        }
      });

      dailyStats.push({
        day: dayName,
        taken: totalTaken,
        missed: totalMissed,
        total: totalTaken + totalMissed
      });
    }

    return dailyStats;
  };

  const getDaysLabels = () => {
    if (!bloodPressureData || bloodPressureData.length === 0) {
      return ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    }
    
    return bloodPressureData.map((item, index) => {
      if (item.measuredAt) {
        const date = new Date(item.measuredAt);
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return dayNames[date.getDay()];
      }
      return `Day ${index + 1}`;
    });
  };

  // Get blood pressure measurement days count
  const getBloodPressureDays = () => {
    if (!bloodPressureData || bloodPressureData.length === 0) {
      return "0/7 ngày";
    }
    return `${bloodPressureData.length}/7 ngày`;
  };

  // Check for high blood pressure alerts
  const getBloodPressureAlert = () => {
    if (!bloodPressureData || bloodPressureData.length === 0) {
      return "Chưa có dữ liệu";
    }
    
    // Find the most recent high reading
    const highReadings = bloodPressureData.filter(item => 
      item.systolic > 130 || item.diastolic > 85
    );
    
    if (highReadings.length === 0) {
      return "Bình thường";
    }
    
    // Get the most recent high reading
    const mostRecent = highReadings[0];
    if (mostRecent.measuredAt) {
      const date = new Date(mostRecent.measuredAt);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = dayNames[date.getDay()];
      return `Huyết áp ${dayName}`;
    }
    
    return "Huyết áp cao";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <FontAwesome5 name="chart-line" size={22} color="#3B82F6" />
          <Text style={styles.headerTitle}>Thống kê sức khỏe</Text>
        </View>
      </View>
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 'overview' && (
        <>
          <View style={styles.cardRow}>
            <View style={[styles.statCard, {backgroundColor: '#D1FAE5'}]}>
              <Text style={styles.statValue}>{getCompliancePercentage()}%</Text>
              <Text style={styles.statLabel}>Tuân thủ thuốc</Text>
            </View>
            <View style={[styles.statCard, {backgroundColor: '#DBEAFE'}]}>
              <Text style={[styles.statValue, {color: '#3B82F6'}]}>{getAverageBloodPressure()}</Text>
              <Text style={styles.statLabel}>Huyết áp TB</Text>
            </View>
          </View>
          <View style={styles.sectionCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Feather name="target" size={18} color="#10b981" />
              <Text style={styles.sectionTitle}> Tuân thủ uống thuốc tuần này</Text>
            </View>
            <View style={{alignItems: 'center', marginVertical: 8}}>
              <PieChart
                data={getPieChartData().map(item => ({
                  name: item.name,
                  population: item.value,
                  color: item.color,
                  legendFontColor: '#1E293B',
                  legendFontSize: 13
                }))}
                width={Dimensions.get('window').width * 0.9}
                height={180}
                chartConfig={{
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
                }}
                accessor={'population'}
                backgroundColor={'transparent'}
                paddingLeft={'0'}
                hasLegend={false}
                center={[0, 0]}
              />
              <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 12}}>
                {getPieChartData().map((item, idx) => (
                  <View key={idx} style={{alignItems: 'center'}}>
                    <View style={{width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginBottom: 4}} />
                    <Text style={{fontSize: 13}}>{item.name}</Text>
                    <Text style={{fontWeight: 'bold', color: item.color}}>{item.value}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Thống kê nhanh</Text>
            <View style={styles.quickStatRow}>
              <Feather name="check-circle" size={18} color="#10b981" />
              <Text style={styles.quickStatLabel}>Ngày uống thuốc đầy đủ</Text>
              <Text style={{color: '#10b981', fontWeight: 'bold'}}>
                {fullOverview?.stats ? `${fullOverview.stats.on_time + fullOverview.stats.late}/${fullOverview.stats.total} lần` : '5/7 ngày'}
              </Text>
            </View>
            <View style={styles.quickStatRow}>
              <Feather name="heart" size={18} color="#3B82F6" />
              <Text style={styles.quickStatLabel}>Ngày đo huyết áp</Text>
              <Text style={{color: '#3B82F6', fontWeight: 'bold'}}>{getBloodPressureDays()}</Text>
            </View>
            <View style={styles.quickStatRow}>
              <Feather name="alert-circle" size={18} color="#f59e0b" />
              <Text style={styles.quickStatLabel}>Cần chú ý</Text>
              <Text style={{color: '#f59e0b', fontWeight: 'bold'}}>{getBloodPressureAlert()}</Text>
            </View>
          </View>
        </>
      )}
      {activeTab === 'bloodpressure' && (
        <>
          {loading ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <>
              <View style={styles.sectionCard}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <Feather name="activity" size={18} color="#ef4444" />
                  <Text style={styles.sectionTitle}> Biến động huyết áp 7 ngày</Text>
                </View>
                <View style={{alignItems: 'center'}}>
                  <LineChart
                    data={{
                      labels: getDaysLabels(),
                      datasets: [
                        {
                          data: bloodPressureData && bloodPressureData.length > 0
                            ? bloodPressureData.map(item => item.systolic || 120)
                            : [120, 125, 130, 128, 122, 126, 124],
                          color: () => '#ef4444',
                          strokeWidth: 2,
                        },
                        {
                          data: bloodPressureData && bloodPressureData.length > 0
                            ? bloodPressureData.map(item => item.diastolic || 80)
                            : [80, 82, 85, 83, 79, 81, 80],
                          color: () => '#3B82F6',
                          strokeWidth: 2,
                        },
                      ],
                      legend: ['Tâm thu', 'Tâm trương'],
                    }}
                    width={Dimensions.get('window').width * 0.85}
                    height={180}
                    chartConfig={{
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#fff',
                      },
                      propsForBackgroundLines: {
                        stroke: '#E0E7EF',
                      },
                    }}
                    bezier
                    style={{marginVertical: 8, borderRadius: 12}}
                  />
                </View>
              </View>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Chi tiết 7 ngày gần nhất</Text>
                {bloodPressureData && bloodPressureData.length > 0 ? (
                  bloodPressureData.map((record, idx) => {
                    const status = record.systolic > 130 || record.diastolic > 85 ? 'high' : 'normal';
                    // Format date and time
                    const date = record.measuredAt ? new Date(record.measuredAt) : null;
                    let displayDate = '';
                    if (date) {
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - date.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      if (diffDays === 0) {
                        displayDate = `Hôm nay - ${timeStr}`;
                      } else if (diffDays === 1) {
                        displayDate = `Hôm qua - ${timeStr}`;
                      } else {
                        displayDate = `${diffDays} ngày trước - ${timeStr}`;
                      }
                    }
                    return (
                      <View key={record._id || idx} style={[styles.bpRow, status === 'high' ? styles.bpHigh : styles.bpNormal]}>
                        <View>
                          <Text style={{fontWeight: 'bold'}}>{displayDate}</Text>
                          {record.note && (
                            <Text style={{fontSize: 12, color: '#64748B'}}>{record.note}</Text>
                          )}
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                          <Text style={[styles.bpValue, status === 'high' ? {color: '#ef4444'} : {color: '#10b981'}]}>
                            {record.systolic}/{record.diastolic}
                          </Text>
                          <Text style={{fontSize: 12, color: status === 'high' ? '#ef4444' : '#10b981'}}>
                            {status === 'high' ? 'Cao' : 'Bình thường'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{textAlign: 'center', color: '#64748B', padding: 20}}>
                    Chưa có dữ liệu huyết áp
                  </Text>
                )}
              </View>
            </>
          )}
        </>
      )}
      {activeTab === 'medicine' && (
        <>
          <View style={styles.sectionCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Feather name="calendar" size={18} color="#8b5cf6" />
              <Text style={styles.sectionTitle}> Tuân thủ uống thuốc hàng ngày</Text>
            </View>
            {getDailyStatsFromAPI().map((item, idx) => (
              <View key={idx} style={styles.medicineRow}>
                <Text style={{fontWeight: 'bold'}}>{item.day}</Text>
                <Text style={{color: '#10b981'}}>Đã uống: {item.taken}</Text>
                <Text style={{color: '#ef4444'}}>Bỏ lỡ: {item.missed}</Text>
              </View>
            ))}
          </View>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tuân thủ theo loại thuốc</Text>
            {fullOverview?.medicationGroups && fullOverview.medicationGroups.length > 0 ? (
              fullOverview.medicationGroups.map((medication, idx) => {
                const totalDoses = medication.histories.length;
                const takenDoses = medication.histories.filter(h => h.taken).length;
                const compliance = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
                
                return (
                  <View key={idx} style={[styles.medicineRow, {backgroundColor: idx % 2 === 0 ? '#F3E8FF' : '#ECFEFF'}]}>
                    <View>
                      <Text style={{fontWeight: 'bold'}}>{medication.medicationName}</Text>
                      <Text style={{fontSize: 13, color: '#64748B'}}>
                        {medication.note || 'Không có ghi chú'}
                      </Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={{color: idx % 2 === 0 ? '#8b5cf6' : '#06b6d4', fontWeight: 'bold'}}>
                        {compliance}%
                      </Text>
                      <Text style={{fontSize: 12, color: '#64748B'}}>
                        {takenDoses}/{totalDoses} lần
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              // Fallback to static data
              <>
                <View style={[styles.medicineRow, {backgroundColor: '#F3E8FF'}]}>
                  <View>
                    <Text style={{fontWeight: 'bold'}}>Chưa có dữ liệu</Text>
                    <Text style={{fontSize: 13, color: '#64748B'}}></Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={{color: '#8b5cf6', fontWeight: 'bold'}}></Text>
                    <Text style={{fontSize: 12, color: '#64748B'}}></Text>
                  </View>
                </View>
                <View style={[styles.medicineRow, {backgroundColor: '#ECFEFF'}]}>
                  <View>
                    <Text style={{fontWeight: 'bold'}}>Chưa có dữ liệu</Text>
                    <Text style={{fontSize: 13, color: '#64748B'}}></Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={{color: '#06b6d4', fontWeight: 'bold'}}></Text>
                    <Text style={{fontSize: 12, color: '#64748B'}}></Text>
                  </View>
                </View>
              </>
            )}
          </View>
          {/* <View style={[styles.sectionCard, {backgroundColor: '#DBEAFE'}]}>
            <Text style={[styles.sectionTitle, {color: '#3B82F6'}]}>💡 Gợi ý cải thiện</Text>
            {fullOverview?.suggestions && fullOverview.suggestions.length > 0 ? (
              fullOverview.suggestions.map((suggestion, idx) => (
                <Text key={idx} style={styles.suggestion}>• {suggestion}</Text>
              ))
            ) : (
              // Fallback suggestions
              <>
                <Text style={styles.suggestion}>• Đặt báo thức cho thuốc tối để không quên</Text>
                <Text style={styles.suggestion}>• Candesartan bỏ lỡ 2 lần tuần này, cần chú ý hơn</Text>
                <Text style={styles.suggestion}>• Huyết áp thứ 4 cao hơn bình thường, có thể do bỏ lỡ thuốc tối thứ 3</Text>
              </>
            )}
          </View> */}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FB', padding: 16 },
  header: { marginTop: 30, marginBottom: 32 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginLeft: 8 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  pageButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  pageButtonDisabled: {
    backgroundColor: '#B6D5FA',
  },
  tabsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E0E7EF', overflow: 'hidden', marginTop: 10 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  tabBtnActive: { backgroundColor: '#DBEAFE' },
  tabText: { fontSize: 15, color: '#64748B', fontWeight: 'bold' },
  tabTextActive: { color: '#2563eb' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { flex: 1, marginHorizontal: 4, borderRadius: 14, padding: 18, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#10b981' },
  statLabel: { fontSize: 14, color: '#64748B', marginTop: 4 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E0E7EF' },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, color: '#1E293B' },
  quickStatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  quickStatLabel: { marginLeft: 8, fontSize: 15, color: '#1E293B', flex: 1 },
  bpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderRadius: 8, marginBottom: 4, paddingHorizontal: 8 },
  bpHigh: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  bpNormal: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' },
  bpValue: { fontWeight: 'bold', fontSize: 16 },
  medicineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#E0E7EF' },
  suggestion: { fontSize: 14, color: '#3B82F6', marginVertical: 2 },
});

export default HealthStatisticsScreen;
