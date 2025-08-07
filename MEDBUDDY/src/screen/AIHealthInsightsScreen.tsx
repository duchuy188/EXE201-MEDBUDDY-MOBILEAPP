import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const insights = [
  {
    type: 'warning',
    title: 'Huyết áp có xu hướng tăng',
    description: 'Huyết áp trung bình 7 ngày qua: 128/85 mmHg',
    recommendation: 'Nên giảm natri trong chế độ ăn và tăng cường vận động nhẹ',
    icon: <Ionicons name="trending-up" size={24} color="#f59e0b" />,
  },
  {
    type: 'warning',
    title: 'Tuân thủ uống thuốc cần cải thiện',
    description: 'Tỷ lệ uống thuốc đúng giờ: 86%',
    recommendation: 'Thiết lập thêm báo thức hoặc nhờ người thân nhắc nhở',
    icon: <Ionicons name="alert-circle" size={24} color="#f59e0b" />,
  },
  {
    type: 'positive',
    title: 'Đo huyết áp đều đặn',
    description: 'Bạn đã đo huyết áp đều đặn 7/7 ngày qua',
    recommendation: 'Hãy tiếp tục duy trì thói quen tốt này',
    icon: <Ionicons name="checkmark-circle" size={24} color="#10b981" />,
  },
  {
    type: 'info',
    title: 'Gợi ý từ AI',
    description: 'Dựa trên dữ liệu của bạn, thời điểm tốt nhất để đo huyết áp là 7:00 AM',
    recommendation: 'Đo huyết áp sau khi thức dậy 30 phút và trước khi ăn sáng',
    icon: <Ionicons name="bulb-outline" size={24} color="#3B82F6" />,
  },
];

const getCardStyle = (type: string) => {
  switch (type) {
    case 'positive': return { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' };
    case 'warning': return { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' };
    case 'critical': return { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' };
    default: return { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' };
  }
};

const AIHealthInsightsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="bulb-outline" size={28} color="#3B82F6" style={{marginRight: 8}} />
        <Text style={styles.headerTitle}>AI Phân tích sức khỏe người thân</Text>
      </View>
      {insights.map((insight, idx) => (
        <View key={idx} style={[styles.card, getCardStyle(insight.type)]}>
          <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
            <View style={{marginTop: 2, marginRight: 10}}>{insight.icon}</View>
            <View style={{flex: 1}}>
              <Text style={styles.cardTitle}>{insight.title}</Text>
              <Text style={styles.cardDesc}>{insight.description}</Text>
              <View style={styles.recommendBox}>
                <Text style={styles.recommendText}>💡 Khuyến nghị: {insight.recommendation}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
      <View style={styles.footerBox}>
        <Text style={styles.footerText}>
          🤖 Phân tích được tạo bởi AI dựa trên dữ liệu sức khỏe của người thân. Luôn tham khảo ý kiến bác sĩ cho quyết định quan trọng.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FB', padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  card: { borderWidth: 2, borderRadius: 14, padding: 16, marginBottom: 14 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: '#1E293B', marginBottom: 4 },
  cardDesc: { color: '#64748B', fontSize: 14, marginBottom: 8 },
  recommendBox: { backgroundColor: '#fff', borderRadius: 8, padding: 10 },
  recommendText: { color: '#3B82F6', fontSize: 14 },
  footerBox: { backgroundColor: '#DBEAFE', borderRadius: 10, padding: 12, marginTop: 10 },
  footerText: { color: '#64748B', fontSize: 13, textAlign: 'center' },
});

export default AIHealthInsightsScreen;
