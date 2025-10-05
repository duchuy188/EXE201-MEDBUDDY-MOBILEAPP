import apiClient from './index';

export interface RepeatTime {
  time: string; // HH:mm format
  _id?: string;
}

export interface ReminderTime {
  time: 'Sáng' | 'Chiều' | 'Tối';
  _id?: string;
}

export interface Reminder {
  _id?: string;
  userId: string;
  medicationId: string;
  reminderType: 'normal' | 'voice';
  times: ReminderTime[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  repeatTimes: RepeatTime[];
  note?: string;
  voice?: 'banmai' | 'lannhi' | 'leminh' | 'myan' | 'thuminh' | 'giahuy' | 'linhsan';
  isActive?: boolean;
  createdAt?: string;
  // Legacy fields for compatibility
  status?: 'pending' | 'completed' | 'snoozed';
  snoozeTime?: string;
  createdBy?: string;
  createdByType?: 'patient' | 'relative';
}

interface UpdateReminderStatusPayload {
  action: 'take' | 'skip' | 'snooze';
  time?: string;
  status?: 'pending' | 'on_time' | 'late' | 'missed' | 'skipped' | 'snoozed';
}

class ReminderService {
  // Lấy danh sách nhắc nhở
  async getReminders(token: string): Promise<{ success: boolean; data: Reminder[] }> {
    const res = await apiClient.get('/reminders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Thêm nhắc nhở mới
  async addReminder(
    data: Omit<Reminder, '_id' | 'createdAt' | 'isActive' | 'status'>, 
    token: string
  ): Promise<{ success: boolean; data: Reminder }> {
    const res = await apiClient.post('/reminders', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xem chi tiết nhắc nhở
  async getReminderById(id: string, token: string): Promise<{ success: boolean; data: Reminder }> {
    const res = await apiClient.get(`/reminders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật nhắc nhở
  async updateReminder(
    id: string, 
    data: Partial<Reminder>, 
    token: string
  ): Promise<{ success: boolean; data: Reminder }> {
    const res = await apiClient.put(`/reminders/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa nhắc nhở
  async deleteReminder(id: string, token: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete(`/reminders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật trạng thái lịch uống thuốc (bỏ static)
  async updateReminderStatus(
    id: string, 
    payload: UpdateReminderStatusPayload,
    token: string
  ): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.patch(`/reminders/${id}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xem trạng thái các lần uống hôm nay (bỏ static)
  async getReminderStatus(id: string, token: string): Promise<any> {
    try {
      const res = await apiClient.get(`/reminders/${id}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('getReminderStatus response:', res.data);
      return res.data;
    } catch (error) {
      console.error('getReminderStatus error:', error);
      throw error;
    }
  }
}

export default new ReminderService();