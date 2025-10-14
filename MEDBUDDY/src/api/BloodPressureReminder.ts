import apiClient from './index';

export interface BloodPressureReminderTime {
  time: string; // kiểu giờ, ví dụ "07:00"
  label?: string; // ví dụ: "Sáng", "Chiều"
}

export interface BloodPressureReminder {
  _id?: string;
  userId: string;
  times: BloodPressureReminderTime[];
  note?: string;
  isActive?: boolean;
  status?: 'pending' | 'completed' | 'snoozed';
  createdAt?: string;
  updatedAt?: string;
}

class BloodPressureReminderService {
  // Lấy danh sách nhắc đo huyết áp của user (không cần check feature)
  async getBloodPressureReminders(token: string, userId?: string) {
    const res = await apiClient.get('/blood-pressure-reminder', {
      headers: { Authorization: `Bearer ${token}` },
      params: userId ? { userId } : undefined,
    });
    return res.data;
  }

  // Tạo nhắc đo huyết áp (yêu cầu feature Blood Pressure Reminder)
  async createBloodPressureReminder(
    data: Omit<BloodPressureReminder, '_id' | 'createdAt' | 'updatedAt'>, 
    token: string
  ) {
    const res = await apiClient.post('/blood-pressure-reminder', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xem chi tiết nhắc đo huyết áp (không cần check feature)
  async getBloodPressureReminderById(id: string, token: string) {
    const res = await apiClient.get(`/blood-pressure-reminder/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật nhắc đo huyết áp (yêu cầu feature Blood Pressure Reminder)
  async updateBloodPressureReminder(
    id: string, 
    data: Partial<BloodPressureReminder>, 
    token: string
  ) {
    const res = await apiClient.put(`/blood-pressure-reminder/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa nhắc đo huyết áp (không cần check feature)
  async deleteBloodPressureReminder(id: string, token: string) {
    const res = await apiClient.delete(`/blood-pressure-reminder/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new BloodPressureReminderService();