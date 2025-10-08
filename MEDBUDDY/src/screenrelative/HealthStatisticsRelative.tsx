import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Modal, FlatList, SafeAreaView, Platform } from "react-native";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { PieChart, LineChart } from 'react-native-chart-kit';
import RelativePatientService from '../api/RelativePatient';
import type { WeeklyOverview, FullOverview } from '../api/RelativePatient';
import BloodPressureService from '../api/RelativePatient';// keep types if defined there
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import WeeklyReportCard from '../components/WeeklyReportCard';

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

const HealthStatisticsRelative: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bloodPressureData, setBloodPressureData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOverview | null>(null);
  const [fullOverview, setFullOverview] = useState<FullOverview | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const route = useRoute();

  // Retrieve token and userId from navigation params
  // @ts-ignore
  const token = route.params?.token || '';
  // @ts-ignore
  const userId = route.params?.userId || '';
  // target patient id: selectedPatient._id (if chosen) or userId param
  const targetPatientId = selectedPatient?._id || userId;

  // Load patients when token becomes available and auto-select first patient if none selected
  useEffect(() => {
    if (!token) return;
    (async () => {
      const list = await loadPatients();
      if (!selectedPatient && Array.isArray(list) && list.length > 0) {
        setSelectedPatient(list[0]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Fetch data only when we have a validated selected patient id
  useEffect(() => {
    if (!token || !selectedPatient?._id) return;
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedPatient?._id]);

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

  // Load patients list for selector (relative) - returns normalized array immediately
  const loadPatients = async () => {
    if (!token) return [];
    try {
      const res = await RelativePatientService.getPatientsOfRelative(token);
      const list = res?.patients || res?.data || res || [];
      const arr = Array.isArray(list) ? list : [];
      const normalized = arr.map((item: any) => {
        const p = item?.patient || item;
        return {
          _id: p?._id || p?.id || '',
          fullName: p?.fullName || p?.name || '',
          email: p?.email || '',
          phone: p?.phone || p?.phoneNumber || p?.phone_number || '',
          dateOfBirth: p?.dateOfBirth || p?.dob || '',
        };
      });
      setPatients(normalized);
      // Return normalized array so caller can decide whether to auto-select
      return normalized;
    } catch (e) {
      console.log('Load patients error', e);
      return [];
    }
  };

  // Call loadPatients when opening selector
  const openPatientSelector = async () => {
    await loadPatients();
    setShowPatientSelector(true);
  };

  // --- BEGIN: thêm 2 hàm fetch để tránh ReferenceError ---
  const fetchBloodPressureData = async (patientId?: string) => {
    const pid = patientId || targetPatientId;
    if (!pid || !token) return;
    try {
      const resp = await RelativePatientService.getPatientBloodPressures(pid, token);
      const arr = Array.isArray(resp) ? resp : (resp?.data || resp?.bloodPressures || []);
      const recentData = Array.isArray(arr) ? arr.slice(0, 7) : [];
      setBloodPressureData(recentData);
    } catch (err: any) {
      console.error('Failed to fetch blood pressure data:', err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi lấy huyết áp';
      if (status === 403) {
        setUpgradeMessage(msg);
        setUpgradeModalVisible(true);
      } else {
        Alert.alert('Lỗi', 'Không thể lấy dữ liệu huyết áp.');
      }
      setBloodPressureData([]);
    }
  };

  const fetchMedicationData = async (patientId?: string) => {
    const pid = patientId || targetPatientId;
    if (!pid || !token) return;
    try {
      const weeklyResp = await RelativePatientService.getPatientWeeklyOverview(pid, token);
      const fullResp = await RelativePatientService.getPatientFullOverview(pid, token);
      const weekly = weeklyResp?.data ?? weeklyResp ?? null;
      const full = fullResp?.data ?? fullResp ?? null;
      setWeeklyOverview(weekly || null);
      setFullOverview(full || null);
    } catch (err: any) {
      console.error('Failed to fetch medication data:', err);
      const status = err?.response?.status;
      const serverData = err?.response?.data;
      if (status === 403) {
        setUpgradeMessage(serverData?.message || 'Bạn không có quyền truy cập dữ liệu này');
        setUpgradeModalVisible(true);
      } else if (status === 500) {
        const msg = serverData?.message || serverData?.error || 'Lỗi server nội bộ (500).';
        Alert.alert('Lỗi', `Không thể lấy dữ liệu thuốc: ${msg}`);
      } else {
        Alert.alert('Lỗi', serverData?.message || 'Không thể lấy dữ liệu thuốc.');
      }
      setWeeklyOverview(null);
      setFullOverview(null);
    }
  };
  // --- END: thêm 2 hàm fetch ---

  // Get pie chart data from API
  const getPieChartData = () => {
    if (!weeklyOverview || !weeklyOverview.summary) {
      // fallback data
      return [
        { name: "Uống đúng giờ", value: 0, color: "#10b981" },
        { name: "Uống muộn", value: 0, color: "#f59e0b" },
        { name: "Bỏ lỡ", value: 0, color: "#ef4444" }
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
      { name: "Uống đúng giờ", value: 0, color: "#10b981" },
      { name: "Uống muộn", value: 0, color: "#f59e0b" },
      { name: "Bỏ lỡ", value: 0, color: "#ef4444" }
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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
                  {fullOverview?.stats ? `${fullOverview.stats.on_time + fullOverview.stats.late}/${fullOverview.stats.total} lần` : '0/7 ngày'}
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

      {/* Patient selector modal (moved into returned JSX) */}
      <Modal visible={showPatientSelector} animationType="slide" transparent onRequestClose={() => setShowPatientSelector(false)}>
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)' }}>
          <View style={{ width:'90%', backgroundColor:'#fff', borderRadius:12, padding:16, maxHeight:'75%' }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <Text style={{ fontSize:18, fontWeight:'600' }}>Chọn người bệnh</Text>
              <TouchableOpacity onPress={() => setShowPatientSelector(false)}><Text style={{fontSize:18}}>✕</Text></TouchableOpacity>
            </View>

            <FlatList
              data={patients}
              keyExtractor={it => it._id || it.email || Math.random().toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={{ padding:12, borderBottomWidth:1, borderColor:'#eee', backgroundColor: selectedPatient?._id === item._id ? '#EBF4FF' : '#fff' }}
                  onPress={() => { setSelectedPatient(item); setShowPatientSelector(false); }}
                >
                  <Text style={{fontWeight:'700'}}>{item.fullName || 'Tên chưa cập nhật'}</Text>
                  <Text style={{color:'#9CA3AF', marginTop:6}}>{item.email || item.phone || item._id}</Text>
                  {item.dateOfBirth ? <Text style={{color:'#9CA3AF', marginTop:4}}>Sinh: {new Date(item.dateOfBirth).toLocaleDateString('vi-VN')}</Text> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={{ padding:12, alignItems:'center' }}>
                  <Text style={{ color:'#6B7280' }}>Chưa có người bệnh</Text>
                </View>
              )}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }} onPress={() => { setShowPatientSelector(false); setSelectedPatient(null); }}>
                <Text style={{ color: '#6B7280' }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upgrade modal */}
      <Modal visible={upgradeModalVisible} animationType="slide" transparent onRequestClose={() => setUpgradeModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <View style={{ width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'center' }}>Thông báo nâng cấp</Text>
            <Text style={{ fontSize: 16, marginBottom: 24, textAlign: 'center' }}>{upgradeMessage}</Text>

            <TouchableOpacity
              style={{ backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 12 }}
              onPress={() => {
                setUpgradeModalVisible(false);
                // Navigate to upgrade screen or link
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Nâng cấp ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 12, alignItems: 'center' }}
              onPress={() => setUpgradeModalVisible(false)}
            >
              <Text style={{ color: '#6B7280' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8FB' },
  container: { padding: 14, paddingTop: 30, paddingBottom: 32 },

  header: { paddingVertical: 6, marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', marginLeft: 8, color: '#0F172A' },

  // Tabs container styled as a rounded pill (updated)
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignSelf: 'center',
    width: '94%',                 // same horizontal inset as screenshots
    backgroundColor: '#EFF6FF',   // pill background
    padding: 6,
    borderRadius: 999,
    paddingHorizontal: 6,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: Platform.OS === 'android' ? 1 : 0
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBtnActive: {
    backgroundColor: '#3B82F6', // filled blue for active
    shadowColor: '#3B82F6',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
    transform: [{ translateY: -2 }] // subtle lifted look
  },
  tabText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#FFFFFF', fontWeight: '800' },

  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: Platform.OS === 'android' ? 3 : 0
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#065f46' },
  statLabel: { color: '#475569', marginTop: 6 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 2 : 0,
    borderWidth: 0
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },

  quickStatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  quickStatLabel: { color: '#334155', marginLeft: 8, flex: 1 },

  medicineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#FAFAFF'
  },

  bpRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 10, marginBottom: 8 },
  bpHigh: { backgroundColor: '#FFF7F7', borderWidth: 0 },
  bpNormal: { backgroundColor: '#F0FDF4', borderWidth: 0 },
  bpValue: { fontSize: 18, fontWeight: '800' },

  suggestion: { color: '#374151', marginVertical: 4 },

  // patient selector improvements
  patientBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 2 : 0
  },
  patientName: { fontWeight: '700', color: '#0F172A' },
  patientMeta: { color: '#9CA3AF', marginTop: 6, fontSize: 13 },
});

export default HealthStatisticsRelative;
