import apiClient from './index';

export interface BloodPressureReminderTime {
  time: string; // kiểu giờ, ví dụ "07:00"
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

// Lấy danh sách nhắc đo huyết áp của user
export async function getBloodPressureReminders(token: string, userId?: string) {
  const res = await apiClient.get('/blood-pressure-reminder', {
    headers: { Authorization: `Bearer ${token}` },
    params: userId ? { userId } : undefined,
  });
  return res.data;
}

// Tạo nhắc đo huyết áp
export async function createBloodPressureReminder(data: Omit<BloodPressureReminder, '_id' | 'createdAt' | 'updatedAt'>, token: string) {
  const res = await apiClient.post('/blood-pressure-reminder', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// Xem chi tiết nhắc đo huyết áp
export async function getBloodPressureReminderById(id: string, token: string) {
  const res = await apiClient.get(`/blood-pressure-reminder/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// Cập nhật nhắc đo huyết áp
export async function updateBloodPressureReminder(id: string, data: Partial<BloodPressureReminder>, token: string) {
  const res = await apiClient.put(`/blood-pressure-reminder/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// Xóa nhắc đo huyết áp
export async function deleteBloodPressureReminder(id: string, token: string) {
  const res = await apiClient.delete(`/blood-pressure-reminder/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}