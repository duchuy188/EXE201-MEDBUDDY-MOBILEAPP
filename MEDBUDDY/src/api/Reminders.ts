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
}

class ReminderService {
  // Lấy danh sách nhắc nhở
  async getReminders(token: string) {
    const res = await apiClient.get('/reminders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Đặt lịch nhắc đo huyết áp
  async addBloodPressureReminder(data: Omit<Reminder, 'medicationId' | '_id' | 'createdAt'>, token: string) {
    const res = await apiClient.post('/reminders/blood-pressure', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Chỉnh sửa nhắc đo huyết áp
  async updateBloodPressureReminder(id: string, data: Partial<Reminder>, token: string) {
    const res = await apiClient.put(`/reminders/blood-pressure/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa nhắc đo huyết áp
  async deleteBloodPressureReminder(id: string, token: string) {
    const res = await apiClient.delete(`/reminders/blood-pressure/${id}`, {
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