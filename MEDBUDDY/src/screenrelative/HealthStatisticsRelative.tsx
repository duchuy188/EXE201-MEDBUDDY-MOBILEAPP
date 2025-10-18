import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Modal, FlatList, SafeAreaView, Platform } from "react-native";
import { FontAwesome5, Feather, Ionicons } from "@expo/vector-icons";
import { PieChart, LineChart } from 'react-native-chart-kit';
import RelativePatientService from '../api/RelativePatient';
// import type { WeeklyOverview, FullOverview } from '../api/RelativePatient';
import BloodPressureService from '../api/RelativePatient';// keep types if defined there
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
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
  const [weeklyOverview, setWeeklyOverview] = useState<any | null>(null);
  const [fullOverview, setFullOverview] = useState<any | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  
  // AI Insights states
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const route = useRoute();
  const navigation = useNavigation();

  // Retrieve token and userId from navigation params
  // @ts-ignore
  const token = route.params?.token || '';
  // @ts-ignore
  const userId = route.params?.userId || '';
  // target patient id: prefer selectedPatient.userId, then backend _id, then userId param
  const targetPatientId = selectedPatient?.userId || selectedPatient?._id || userId;

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

  // Fetch data only when we have a validated selected patient id (either userId or _id)
  useEffect(() => {
    if (!token || (!selectedPatient?._id && !selectedPatient?.userId)) return;
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedPatient?._id, selectedPatient?.userId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      console.log('fetchAllData selectedPatient=', selectedPatient);
      console.log('fetchAllData targetPatientId=', targetPatientId);
      await Promise.all([
        fetchBloodPressureData(),
        fetchMedicationData(),
        fetchAIInsights()
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
    console.log('fetchBloodPressureData pid=', pid);
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
    console.log('fetchMedicationData pid=', pid);
    if (!pid || !token) return;
    try {
      const weeklyResp = await RelativePatientService.getPatientWeeklyOverview(pid, token);
      const fullResp = await RelativePatientService.getPatientFullOverview(pid, token);
      console.log('getPatientWeeklyOverview response:', weeklyResp);
      console.log('getPatientFullOverview response:', fullResp);

      const unwrapWeekly = (r: any) => {
        if (!r) return null;
        // If response already contains top-level medications/summary/period, use it
        if (r.medications || r.summary || r.period) return r;
        // Otherwise prefer r.data when it's an object
        if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) return r.data;
        return r;
      };

      const unwrapFull = (r: any) => {
        if (!r) return null;
        // If response already contains expected fields, use it
        if (r.adherenceRate || r.medicationGroups || r.stats) return r;
        // Otherwise prefer r.data when it's an object
        if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) return r.data;
        return r;
      };

      const weekly = unwrapWeekly(weeklyResp);
      const full = unwrapFull(fullResp);
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

  // Fetch AI insights for patient
  const fetchAIInsights = async (patientId?: string) => {
    const pid = patientId || targetPatientId;
    if (!pid || !token) return;
    try {
      const response = await RelativePatientService.getPatientAIInsights(pid, token, 10);
      console.log('getPatientAIInsights response:', response);
      
      const data = response.data || response;
      const insights = data.insights || data.analyses || data || [];
      console.log('Processed insights:', insights);
      setAiInsights(Array.isArray(insights) ? insights : []);
    } catch (err: any) {
      console.error('Failed to fetch AI insights:', err);
      const status = err?.response?.status;
      if (status === 403) {
        setUpgradeMessage('Bạn không có quyền xem AI insights của bệnh nhân này');
        setUpgradeModalVisible(true);
      } else {
        console.log('AI insights not available or error:', err?.message);
      }
      setAiInsights([]);
    }
  };

  // Handle get AI insights button press
  const handleGetAIInsights = async () => {
    if (!targetPatientId || !token) {
      Alert.alert('Lỗi', 'Không thể lấy thông tin bệnh nhân');
      return;
    }
    
    try {
      setLoadingAI(true);
      console.log('Calling getPatientAIInsights API...');
      const response = await RelativePatientService.getPatientAIInsights(targetPatientId, token, 10);
      console.log('getPatientAIInsights response:', response);

      const data = response.data || response;
      const insights = data.insights || data.analyses || data || [];
      console.log('Processed insights:', insights);
      setAiInsights(Array.isArray(insights) ? insights : []);

      if (insights.length === 0) {
        Alert.alert('Thông báo', 'Chưa có dữ liệu phân tích AI. Bệnh nhân cần đo huyết áp vài lần trước.');
      } else {
        // Show modal with all insights
        setAiAnalysisResult({
          userName: selectedPatient?.fullName || 'Bệnh nhân',
          insights: insights,
          type: 'insights_summary'
        });
        setShowAIModal(true);
      }
    } catch (error) {
      console.error('getPatientAIInsights error:', error);
      Alert.alert('Lỗi', 'Không thể lấy AI insights của bệnh nhân');
    } finally {
      setLoadingAI(false);
    }
  };

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
      weeklyOverview.medications.forEach((med: any) => {
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
        {/* Patient selector button */}
        <View style={{ width: '94%', alignSelf: 'center', marginBottom: 12 }}>
          <TouchableOpacity style={styles.patientBtn} onPress={openPatientSelector}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <View style={{flex: 1}}>
                <Text style={styles.patientName}>{selectedPatient?.fullName || 'Chọn người bệnh'}</Text>
                <Text style={styles.patientMeta}>{selectedPatient?.email || selectedPatient?.phone || ''}</Text>
              </View>
              <Ionicons name="chevron-down" size={24} color="#64748B" />
            </View>
          </TouchableOpacity>
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

            {/* AI Analysis Section */}
            {!showAIModal && (
              <View style={styles.sectionCard}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                  <Text style={{fontWeight: 'bold', color: '#8B5CF6'}}>🤖 AI Phân tích tổng quan</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#8B5CF6',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                    onPress={handleGetAIInsights}
                    disabled={loadingAI}
                  >
                    {loadingAI ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={12} color="#fff" />
                        <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4}}>
                          Cập nhật
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {aiInsights.length > 0 ? (
                  aiInsights.slice(0, 3).map((insight, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        backgroundColor: '#F3F4F6',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: '#8B5CF6'
                      }}
                      onPress={() => {
                        setAiAnalysisResult(insight);
                        setShowAIModal(true);
                      }}
                    >
                      <Text style={{fontWeight: 'bold', color: '#374151', marginBottom: 4}}>
                        {insight.summary || insight.title || `Phân tích ${index + 1}`}
                      </Text>
                      <Text style={{fontSize: 12, color: '#6B7280'}} numberOfLines={2}>
                        {insight.analysis || insight.description || 'Phân tích AI về tình trạng sức khỏe'}
                      </Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4}}>
                        {insight.riskLevel && (
                          <View style={{
                            backgroundColor: insight.riskLevel === 'cao' ? '#FEE2E2' : 
                                           insight.riskLevel === 'trung bình' ? '#FEF3C7' : '#D1FAE5',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4
                          }}>
                            <Text style={{
                              fontSize: 10,
                              fontWeight: 'bold',
                              color: insight.riskLevel === 'cao' ? '#DC2626' : 
                                     insight.riskLevel === 'trung bình' ? '#D97706' : '#059669'
                            }}>
                              {insight.riskLevel.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        {insight.analyzedAt && (
                          <Text style={{fontSize: 10, color: '#9CA3AF'}}>
                            {new Date(insight.analyzedAt).toLocaleDateString('vi-VN')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={{alignItems: 'center', paddingVertical: 20}}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#F3F4F6',
                        padding: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: '#E5E7EB',
                        borderStyle: 'dashed'
                      }}
                      onPress={handleGetAIInsights}
                      disabled={loadingAI}
                    >
                      {loadingAI ? (
                        <ActivityIndicator size="small" color="#8B5CF6" />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                          <Text style={{color: '#8B5CF6', fontWeight: 'bold', marginTop: 4}}>
                            Lấy phân tích AI
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <Text style={{color: '#6B7280', fontSize: 12, marginTop: 8, textAlign: 'center'}}>
                      Phân tích tổng hợp dựa trên lịch sử đo huyết áp của bệnh nhân
                    </Text>
                  </View>
                )}
              </View>
            )}
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

                {/* AI Analysis Section for Blood Pressure */}
                {!showAIModal && (
                  <View style={styles.sectionCard}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                      <Text style={{fontWeight: 'bold', color: '#8B5CF6'}}>🤖 AI Phân tích huyết áp</Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#8B5CF6',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                        onPress={handleGetAIInsights}
                        disabled={loadingAI}
                      >
                        {loadingAI ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="refresh" size={12} color="#fff" />
                            <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4}}>
                              Cập nhật
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {aiInsights.length > 0 ? (
                      aiInsights.slice(0, 3).map((insight, index) => (
                        <TouchableOpacity
                          key={index}
                          style={{
                            backgroundColor: '#F3F4F6',
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 8,
                            borderLeftWidth: 3,
                            borderLeftColor: '#8B5CF6'
                          }}
                          onPress={() => {
                            setAiAnalysisResult(insight);
                            setShowAIModal(true);
                          }}
                        >
                          <Text style={{fontWeight: 'bold', color: '#374151', marginBottom: 4}}>
                            {insight.summary || insight.title || `Phân tích huyết áp ${index + 1}`}
                          </Text>
                          <Text style={{fontSize: 12, color: '#6B7280'}} numberOfLines={2}>
                            {insight.analysis || insight.description || 'Phân tích AI về tình trạng huyết áp'}
                          </Text>
                          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4}}>
                            {insight.riskLevel && (
                              <View style={{
                                backgroundColor: insight.riskLevel === 'cao' ? '#FEE2E2' : 
                                               insight.riskLevel === 'trung bình' ? '#FEF3C7' : '#D1FAE5',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4
                              }}>
                                <Text style={{
                                  fontSize: 10,
                                  fontWeight: 'bold',
                                  color: insight.riskLevel === 'cao' ? '#DC2626' : 
                                         insight.riskLevel === 'trung bình' ? '#D97706' : '#059669'
                                }}>
                                  {insight.riskLevel.toUpperCase()}
                                </Text>
                              </View>
                            )}
                            {insight.analyzedAt && (
                              <Text style={{fontSize: 10, color: '#9CA3AF'}}>
                                {new Date(insight.analyzedAt).toLocaleDateString('vi-VN')}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={{alignItems: 'center', paddingVertical: 20}}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#F3F4F6',
                            padding: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: '#E5E7EB',
                            borderStyle: 'dashed'
                          }}
                          onPress={handleGetAIInsights}
                          disabled={loadingAI}
                        >
                          {loadingAI ? (
                            <ActivityIndicator size="small" color="#8B5CF6" />
                          ) : (
                            <>
                              <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                              <Text style={{color: '#8B5CF6', fontWeight: 'bold', marginTop: 4}}>
                                Lấy phân tích AI
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <Text style={{color: '#6B7280', fontSize: 12, marginTop: 8, textAlign: 'center'}}>
                          Phân tích AI dựa trên dữ liệu huyết áp của bệnh nhân
                        </Text>
                      </View>
                    )}
                  </View>
                )}
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
                fullOverview.medicationGroups.map((medication: any, idx: number) => {
                  const totalDoses = medication.histories.length;
                  const takenDoses = medication.histories.filter((h: any) => h.taken).length;
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
                  style={{ paddingVertical:14, paddingHorizontal:8, borderBottomWidth:1, borderColor:'#F3F4F6', backgroundColor: selectedPatient?._id === item._id ? '#FBFEFF' : '#fff' }}
                  onPress={() => { setSelectedPatient(item); setShowPatientSelector(false); }}
                >
                  <Text style={{fontWeight:'700', fontSize:16, color: '#0F172A'}}>{item.fullName || 'Tên chưa cập nhật'}</Text>
                  {item.email ? <Text style={{color:'#9CA3AF', marginTop:8}}>Email: {item.email}</Text> : null}
                  {item.phone ? <Text style={{color:'#9CA3AF', marginTop:4}}>SDT: {item.phone}</Text> : null}
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

      {/* Upgrade modal shown when server returns 403 asking to buy plan (NEW) */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.patientModal, { maxHeight: 240 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Không thể tạo lịch hẹn</Text>
              <TouchableOpacity onPress={() => setUpgradeModalVisible(false)}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingTop: 8 }}>
              <Text style={{ color: '#374151', fontSize: 15, lineHeight: 22 }}>
                {upgradeMessage || 'Vui lòng mua gói để sử dụng tính năng này.'}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setUpgradeModalVisible(false)}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 10 }}
                >
                  <Text style={{ color: '#6B7280' }}>Đóng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setUpgradeModalVisible(false);
                    // Navigate to subscription/upgrade screen - replace 'Subscription' with your actual screen name
                    // @ts-ignore
                    (navigation as any)?.navigate?.('PackageScreen');
                  }}
                  style={{ backgroundColor: '#4A7BA7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Mua gói</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Analysis Modal */}
      <Modal visible={showAIModal} transparent animationType="slide">
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
          <View style={{width: '90%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 20}}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16}}>
              <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                {aiAnalysisResult?.type !== 'insights_summary' && (
                  <TouchableOpacity
                    onPress={() => {
                      setAiAnalysisResult({
                        userName: selectedPatient?.fullName || 'Bệnh nhân',
                        insights: aiInsights,
                        type: 'insights_summary'
                      });
                    }}
                    style={{marginRight: 8}}
                  >
                    <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
                  </TouchableOpacity>
                )}
                <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                <Text style={{fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: '#8B5CF6'}}>
                  {aiAnalysisResult?.type === 'insights_summary' ? 'Tổng hợp AI Insights' : 'Chi tiết phân tích'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAIModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loadingAI ? (
              <View style={{alignItems: 'center', padding: 40}}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={{marginTop: 12, color: '#6B7280'}}>Đang phân tích...</Text>
              </View>
            ) : aiAnalysisResult ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#374151'}}>
                  {aiAnalysisResult?.userName || selectedPatient?.fullName || 'Bệnh nhân'}
                </Text>

                {(aiAnalysisResult?.riskLevel || aiAnalysisResult?.urgency) && (
                  <View style={{flexDirection: 'row', marginBottom: 12}}>
                    {aiAnalysisResult?.riskLevel && (
                      <View style={{
                        backgroundColor: aiAnalysisResult.riskLevel === 'cao' ? '#FEE2E2' : 
                                       aiAnalysisResult.riskLevel === 'trung bình' ? '#FEF3C7' : '#D1FAE5',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginRight: 8
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: 'bold',
                          color: aiAnalysisResult.riskLevel === 'cao' ? '#DC2626' : 
                                 aiAnalysisResult.riskLevel === 'trung bình' ? '#D97706' : '#059669'
                        }}>
                          {aiAnalysisResult.riskLevel === 'cao' ? '🚨 CAO' : 
                           aiAnalysisResult.riskLevel === 'trung bình' ? '⚠️ TRUNG BÌNH' : '💡 BÌNH THƯỜNG'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {aiAnalysisResult?.summary && (
                  <View style={{backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 12}}>
                    <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#1F2937'}}>Tóm tắt</Text>
                    <Text style={{fontSize: 13, color: '#1F2937', lineHeight: 18, fontWeight: '500'}}>{aiAnalysisResult.summary}</Text>
                  </View>
                )}

                {(aiAnalysisResult?.riskScore || aiAnalysisResult?.analyzedAt) && (
                  <View style={{backgroundColor: '#EBF4FF', padding: 12, borderRadius: 8, marginBottom: 12}}>
                    <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#1E40AF'}}>Thông tin phân tích</Text>
                    {aiAnalysisResult.riskScore && (
                      <Text style={{fontSize: 13, color: '#1F2937', fontWeight: '500'}}>Điểm rủi ro: {aiAnalysisResult.riskScore}/100</Text>
                    )}
                    {aiAnalysisResult.analyzedAt && (
                      <Text style={{fontSize: 13, color: '#1F2937', fontWeight: '500'}}>
                        Phân tích lúc: {new Date(aiAnalysisResult.analyzedAt).toLocaleString('vi-VN')}
                      </Text>
                    )}
                  </View>
                )}

                {aiAnalysisResult?.type === 'insights_summary' && aiAnalysisResult?.insights ? (
                  aiAnalysisResult.insights.map((insight: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        backgroundColor: '#F9FAFB',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: '#8B5CF6'
                      }}
                      onPress={() => {
                        setAiAnalysisResult(insight);
                      }}
                    >
                      <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#374151'}}>
                        {insight.summary || insight.title || `Phân tích ${index + 1}`}
                      </Text>
                      <Text style={{fontSize: 12, color: '#6B7280'}} numberOfLines={2}>
                        {insight.analysis || insight.description || 'Phân tích AI về tình trạng sức khỏe'}
                      </Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4}}>
                        {insight.riskLevel && (
                          <View style={{
                            backgroundColor: insight.riskLevel === 'cao' ? '#FEE2E2' : 
                                           insight.riskLevel === 'trung bình' ? '#FEF3C7' : '#D1FAE5',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4
                          }}>
                            <Text style={{
                              fontSize: 10,
                              fontWeight: 'bold',
                              color: insight.riskLevel === 'cao' ? '#DC2626' : 
                                     insight.riskLevel === 'trung bình' ? '#D97706' : '#059669'
                            }}>
                              {insight.riskLevel.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        {insight.analyzedAt && (
                          <Text style={{fontSize: 10, color: '#9CA3AF'}}>
                            {new Date(insight.analyzedAt).toLocaleDateString('vi-VN')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : aiAnalysisResult?.analyses && aiAnalysisResult.analyses.length > 0 ? (
                  aiAnalysisResult.analyses.map((analysis: any, index: number) => {
                    console.log('Analysis item:', analysis); // Debug log
                    
                    // Define colors and icons based on analysis status
                    const getCardStyle = (analysis: any) => {
                      if (analysis.status === 'warning') {
                        return { bg: '#FEF3C7', border: '#F59E0B', icon: analysis.icon || '⚠️' };
                      } else if (analysis.status === 'info') {
                        return { bg: '#D1FAE5', border: '#10B981', icon: analysis.icon || '💡' };
                      } else {
                        return { bg: '#DBEAFE', border: '#3B82F6', icon: analysis.icon || '📊' };
                      }
                    };

                    const cardStyle = getCardStyle(analysis);
                    
                    return (
                      <View key={index} style={{
                        backgroundColor: cardStyle.bg,
                        padding: 16,
                        borderRadius: 12,
                        marginBottom: 12,
                        borderLeftWidth: 4,
                        borderLeftColor: cardStyle.border,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2
                      }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                          <Text style={{fontSize: 20, marginRight: 8}}>{cardStyle.icon}</Text>
                          <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1F2937', flex: 1}}>
                            {analysis.title}
                          </Text>
                        </View>
                        
                        {analysis.metric && (
                          <View style={{backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8}}>
                            <Text style={{fontSize: 14, color: '#1F2937', lineHeight: 20, fontWeight: '500'}}>
                              {analysis.metric}
                            </Text>
                          </View>
                        )}

                        {analysis.recommendation && (
                          <View style={{backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0'}}>
                            <Text style={{fontSize: 12, color: '#059669', fontWeight: '600', marginBottom: 4}}>
                              💡 Khuyến nghị
                            </Text>
                            <Text style={{fontSize: 13, color: '#1F2937', lineHeight: 18, fontWeight: '500'}}>
                              {analysis.recommendation}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View style={{alignItems: 'center', padding: 20}}>
                    <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                    <Text style={{color: '#6B7280', marginTop: 8, textAlign: 'center'}}>
                      Không có dữ liệu phân tích
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={{alignItems: 'center', padding: 20}}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={{color: '#6B7280', marginTop: 8, textAlign: 'center'}}>
                  Không thể tải dữ liệu phân tích
                </Text>
              </View>
            )}

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
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  patientModal: { width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 6 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
});

export default HealthStatisticsRelative;
