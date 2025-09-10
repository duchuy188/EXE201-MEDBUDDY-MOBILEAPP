import apiClient from './index';

export interface Reminder {
  _id?: string;
  userId: string;
  medicationId: string;
  time: string; // HH:mm hoặc ISO nếu cần
  date?: string; // Ngày nhắc nhở (YYYY-MM-DD)
  repeat?: 'daily' | 'weekly' | 'custom';
  note?: string;
  isActive?: boolean;
  createdAt?: string;
  status?: 'pending' | 'completed' | 'snoozed';
  snoozeTime?: string;
}

class ReminderService {
  // Lấy danh sách nhắc nhở
  async getReminders(token: string) {
    const res = await apiClient.get('/reminders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Thêm nhắc nhở mới
  async addReminder(data: Omit<Reminder, '_id' | 'createdAt'>, token: string) {
    const res = await apiClient.post('/reminders', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xem chi tiết nhắc nhở
  async getReminderById(id: string, token: string) {
    const res = await apiClient.get(`/reminders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật nhắc nhở
  async updateReminder(id: string, data: Partial<Reminder>, token: string) {
    const res = await apiClient.put(`/reminders/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa nhắc nhở
  async deleteReminder(id: string, token: string) {
    const res = await apiClient.delete(`/reminders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new ReminderService();