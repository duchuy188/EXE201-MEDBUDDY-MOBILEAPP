import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

type Props = {
  title?: string;
  fullOverview?: any | null;
  bloodPressureData?: any[] | null;
  patientId?: string | null;
  selectedPatient?: { _id?: string; fullName?: string; email?: string } | null;
  onOpenSelector?: (() => void) | null;
};

const WeeklyReportCard: React.FC<Props> = ({ title = 'Báo cáo tuần này', fullOverview, bloodPressureData, patientId, selectedPatient, onOpenSelector }) => {
  const onTime = fullOverview?.stats?.on_time ?? 0;
  const late = fullOverview?.stats?.late ?? 0;
  const total = fullOverview?.stats?.total ?? 0;
  const complianceCount = onTime + late;
  const compliancePct = total > 0 ? Math.round((complianceCount / total) * 100) : (fullOverview?.adherenceRate ? Math.round(fullOverview.adherenceRate) : 0);

  // Use only the most recent 7 blood-pressure records (by measuredAt if available)
  const bpSorted = Array.isArray(bloodPressureData) ? [...bloodPressureData].sort((a, b) => {
    const ta = a?.measuredAt ? new Date(a.measuredAt).getTime() : 0;
    const tb = b?.measuredAt ? new Date(b.measuredAt).getTime() : 0;
    return tb - ta;
  }) : [];
  const bpRecent = bpSorted.slice(0, 7);
  const bpDays = bpRecent.length;

  const avgBP = (() => {
    if (!bpRecent || bpRecent.length === 0) return '0/0';
    const totS = bpRecent.reduce((s, it) => s + (it.systolic || 0), 0);
    const totD = bpRecent.reduce((s, it) => s + (it.diastolic || 0), 0);
    const aS = Math.round(totS / bpRecent.length);
    const aD = Math.round(totD / bpRecent.length);
    return `${aS}/${aD}`;
  })();

  return (
    <View style={styles.card}>
      {/* Optional patient selector shown in the card header area */}
      {onOpenSelector ? (
        <TouchableOpacity style={styles.selectorContainer} onPress={onOpenSelector} activeOpacity={0.8}>
          <View style={styles.selectorTextWrap}>
            <Text style={styles.selectorLabel}>Người bệnh</Text>
            <Text style={styles.selectorName}>{selectedPatient?.fullName || 'Chọn người bệnh'}</Text>
            <Text style={styles.selectorEmail}>{selectedPatient?.email || selectedPatient?._id || ''}</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <View style={styles.cardHeader}>
        <FontAwesome5 name="heartbeat" size={20} color="#3B82F6" />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>

      <View style={styles.innerBox}>
        <View style={styles.reportList}>
          <View style={[styles.reportRow, { backgroundColor: '#E8F5E8' }]}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Uống thuốc đúng giờ</Text>
              <Text style={styles.reportSubtitle}>{ total > 0 ? `${complianceCount}/${total} lần` : '0/7 ngày' }</Text>
            </View>
            <Text style={[styles.reportPercentage, { color: '#388E3C' }]}>{compliancePct}%</Text>
          </View>

          <View style={[styles.reportRow, { backgroundColor: '#E0F7FA' }]}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Đo huyết áp</Text>
              <Text style={styles.reportSubtitle}>{`${bpDays}/7 ngày`}</Text>
            </View>
            <Text style={[styles.reportPercentage, { color: '#009688' }]}>{bpDays > 0 ? `${Math.round((bpDays/7)*100)}%` : '0%'}</Text>
          </View>

          <View style={[styles.reportRow, { backgroundColor: '#F0F6FF' }]}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Huyết áp trung bình</Text>
              <Text style={styles.reportSubtitle}>Tuần này</Text>
            </View>
            <Text style={[styles.reportPercentage, { color: '#3B82F6' }]}>{avgBP}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  reportList: {
    gap: 8,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 6,
  },
  reportSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  reportPercentage: {
    fontSize: 18,
    fontWeight: '800',
  },
  innerBox: {
    backgroundColor: '#FBFDFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 0,
    borderColor: '#EEF2F7',
  },
  cardMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  selectorContainer: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: -2,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  selectorTextWrap: {
    // compact text stack
  },
  selectorLabel: { fontSize: 12, color: '#64748B' },
  selectorName: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  selectorEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});

export default WeeklyReportCard;
