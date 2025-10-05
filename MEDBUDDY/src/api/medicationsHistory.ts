import apiClient from './index';

export interface MedicationHistory {
  _id?: string;
  userId: string;
  medicationId: string;
  reminderId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  taken: boolean;
  takenAt?: Date;
  status: 'pending' | 'on_time' | 'late' | 'missed' | 'skipped' | 'snoozed';
  snoozeUntil?: Date;
  snoozeCount: number;
}

export interface WeeklyOverview {
  week: string;
  totalMedications: number;
  takenMedications: number;
  missedMedications: number;
  onTimeMedications: number;
  lateMedications: number;
  adherenceRate: number;
  dailyStats: DailyStats[];
}

export interface DailyStats {
  date: string;
  total: number;
  taken: number;
  missed: number;
  onTime: number;
  late: number;
}

export interface FullOverview {
  totalMedications: number;
  takenMedications: number;
  missedMedications: number;
  onTimeMedications: number;
  lateMedications: number;
  adherenceRate: number;
  recentHistory: MedicationHistory[];
}

class MedicationHistoryService {
  // Lấy tổng quan tuần uống thuốc
  async getWeeklyOverview(userId: string, token: string): Promise<WeeklyOverview> {
    const res = await apiClient.get(`/medication-history/user/${userId}/weekly`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy tất cả lịch sử với overview (không theo tuần)
  async getFullOverview(userId: string, token: string): Promise<FullOverview> {
    const res = await apiClient.get(`/medication-history/user/${userId}/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new MedicationHistoryService();