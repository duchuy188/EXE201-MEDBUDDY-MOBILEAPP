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

  // Tạo lịch hẹn mới (yêu cầu feature Appointment Booking)
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

  // Cập nhật thông tin lịch hẹn (yêu cầu feature Appointment Booking)
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

  // ========== API MỚI: XỬ LÝ TRẠNG THÁI APPOINTMENT ==========

  // Đánh dấu đã đi khám
  async markAsAttended(id: string, token: string) {
    const res = await apiClient.put(`/api/appointments/${id}/mark-attended`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Hoãn lịch hẹn (nhắc lại sau 5 phút)
  async snoozeAppointment(id: string, token: string) {
    const res = await apiClient.put(`/api/appointments/${id}/snooze`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Bỏ qua lịch hẹn (đánh dấu missed)
  async skipAppointment(id: string, token: string) {
    const res = await apiClient.put(`/api/appointments/${id}/skip`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new AppointmentService();