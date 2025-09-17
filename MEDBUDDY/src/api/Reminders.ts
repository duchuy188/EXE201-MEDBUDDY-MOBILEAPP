import apiClient from './index';

export interface Reminder {
  _id?: string;
  userId: string;
  medicationId: string;
  time: string; // HH:mm hoặc ISO nếu cần
  startDate?: string; // Ngày bắt đầu (YYYY-MM-DD)
  endDate?: string; // Ngày kết thúc (YYYY-MM-DD)
  reminderType?: 'normal' | 'voice';
  repeat?: 'daily' | 'weekly' | 'custom';
  repeatDays?: number[]; // Các ngày lặp lại trong tuần (0-6)
  repeatTimes?: { time: string; taken?: boolean }[];
  note?: string;
  voice?: 'banmai' | 'lannhi' | 'leminh' | 'myan' | 'thuminh' | 'giahuy' | 'linhsan';
  speed?: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  audioUrl?: string;
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
    // Đảm bảo truyền đủ các trường backend yêu cầu
    const res = await apiClient.post('/reminders', {
      ...data,
      medicationId: data.medicationId,
      time: data.time,
      startDate: data.startDate,
      endDate: data.endDate,
      reminderType: data.reminderType,
      repeat: data.repeat,
      repeatDays: data.repeatDays,
      repeatTimes: data.repeatTimes,
      note: data.note,
      voice: data.voice,
      speed: data.speed,
      audioUrl: data.audioUrl,
      isActive: data.isActive,
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