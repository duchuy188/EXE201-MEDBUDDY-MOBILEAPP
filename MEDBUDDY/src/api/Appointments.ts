import apiClient from './index';

export interface Appointment {
  _id?: string;
  title: string;
  hospital: string;
  location?: string;
  date: string; // ISO string
  time: string;
  notes?: string;
  userId: string;
  status?: 'pending' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string; // ObjectId của người tạo lịch
  createdByType?: 'patient' | 'relative'; // Loại người tạo
}

class AppointmentService {
  // Lấy danh sách tất cả lịch hẹn
  async getAppointments(token: string) {
    const res = await apiClient.get('/api/appointments', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Tạo lịch hẹn mới
  async addAppointment(data: Omit<Appointment, '_id' | 'createdAt' | 'updatedAt'>, token: string) {
    const res = await apiClient.post('/api/appointments', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy thông tin chi tiết một lịch hẹn
  async getAppointmentById(id: string, token: string) {
    const res = await apiClient.get(`/api/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật thông tin lịch hẹn
  async updateAppointment(id: string, data: Partial<Appointment>, token: string) {
    const res = await apiClient.put(`/api/appointments/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa lịch hẹn
  async deleteAppointment(id: string, token: string) {
    const res = await apiClient.delete(`/api/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new AppointmentService();