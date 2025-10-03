import apiClient from './index';

export interface Reminder {
  _id?: string;
  userId: string;
  medicationId?: string;
  times: { time: string }[]; // Ví dụ: [{ time: 'Sáng' }, { time: 'Chiều' }]
  startDate: string;
  endDate: string;
  reminderType: 'normal' | 'voice';
  repeatTimes?: { time: string; taken?: boolean }[];
  note?: string;
  voice?: 'banmai' | 'lannhi' | 'leminh' | 'myan' | 'thuminh' | 'giahuy' | 'linhsan';
  isActive?: boolean;
  createdAt?: string;
  status?: 'pending' | 'completed' | 'snoozed';
  snoozeTime?: string;
  createdBy?: string; // ObjectId của người tạo lịch
  createdByType?: 'patient' | 'relative'; // Loại người tạo
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
    const res = await apiClient.post('/reminders', {
      ...data,
    }, {
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