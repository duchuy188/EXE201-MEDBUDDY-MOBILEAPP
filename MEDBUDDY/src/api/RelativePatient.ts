import apiClient from './index';

export interface RelativePatient {
  _id?: string;
  patient: string;
  relative: string;
  status: 'pending' | 'accepted' | 'rejected';
  otp?: string;
  otpExpiresAt?: Date;
  createdAt?: string;
  permissions?: ('view_medical_records' | 'schedule_medication' | 'schedule_appointment' | 'manage_health_data')[];
}

export interface AddRelativePatientRequest {
  email: string;
}

export interface ConfirmRelativePatientRequest {
  linkId: string;
  otp: string;
}

class RelativePatientService {
  // Thêm liên kết người thân-người bệnh
  async addRelativePatient(data: AddRelativePatientRequest, token: string) {
    const res = await apiClient.post('/relative-patient/add', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

    async addPatientRelative(data: AddRelativePatientRequest, token: string) {
    const res = await apiClient.post('/relative-patient/add-patient', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xác nhận liên kết bằng OTP
  async confirmRelativePatient(data: ConfirmRelativePatientRequest, token: string) {
    const res = await apiClient.post('/relative-patient/confirm', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy danh sách người bệnh của người thân
  async getPatientsOfRelative(token: string) {
    const res = await apiClient.get('/relative-patient/patients', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy danh sách người thân của người bệnh
  async getRelativesOfPatient(token: string) {
    const res = await apiClient.get('/relative-patient/relatives', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa liên kết giữa người bệnh và người thân
  async deleteRelativePatient(linkId: string, token: string) {
    // Truyền body là { linkId }, headers là tham số thứ 3
    const res = await apiClient.post('/relative-patient/delete', { linkId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // ========== API ĐẶT LỊCH CHO BỆNH NHÂN BỞI NGƯỜI THÂN ==========

  // Đặt lịch uống thuốc cho bệnh nhân
  async createMedicationReminderForPatient(patientId: string, data: any, token: string) {
    const res = await apiClient.post(`/relative-patient/patients/${patientId}/medication-reminder`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Đặt lịch tái khám cho bệnh nhân
  async createAppointmentForPatient(patientId: string, data: any, token: string) {
    const res = await apiClient.post(`/relative-patient/patients/${patientId}/appointment`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy danh sách lịch uống thuốc của bệnh nhân
  async getPatientMedicationReminders(patientId: string, token: string) {
    const res = await apiClient.get(`/relative-patient/patients/${patientId}/medication-reminders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy danh sách lịch tái khám của bệnh nhân
  async getPatientAppointments(patientId: string, token: string) {
    const res = await apiClient.get(`/relative-patient/patients/${patientId}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật lịch uống thuốc của bệnh nhân
  async updatePatientMedicationReminder(patientId: string, reminderId: string, data: any, token: string) {
    const res = await apiClient.put(`/relative-patient/patients/${patientId}/medication-reminder/${reminderId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật lịch tái khám của bệnh nhân
  async updatePatientAppointment(patientId: string, appointmentId: string, data: any, token: string) {
    const res = await apiClient.put(`/relative-patient/patients/${patientId}/appointment/${appointmentId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa lịch uống thuốc của bệnh nhân
  async deletePatientMedicationReminder(patientId: string, reminderId: string, token: string) {
    const res = await apiClient.delete(`/relative-patient/patients/${patientId}/medication-reminder/${reminderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa lịch tái khám của bệnh nhân
  async deletePatientAppointment(patientId: string, appointmentId: string, token: string) {
    const res = await apiClient.delete(`/relative-patient/patients/${patientId}/appointment/${appointmentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // ========== API QUẢN LÝ THUỐC CHO BỆNH NHÂN ==========

  // Lấy danh sách thuốc của bệnh nhân
  async getPatientMedications(patientId: string, token: string) {
    const res = await apiClient.get(`/relative-patient/patients/${patientId}/medications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Thêm thuốc mới cho bệnh nhân
  async createMedicationForPatient(patientId: string, data: any, token: string) {
    const res = await apiClient.post(`/relative-patient/patients/${patientId}/medications`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy chi tiết thuốc cụ thể của bệnh nhân
  async getPatientMedicationById(patientId: string, medicationId: string, token: string) {
    const res = await apiClient.get(`/relative-patient/patients/${patientId}/medications/${medicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật thuốc của bệnh nhân
  async updatePatientMedication(patientId: string, medicationId: string, data: any, token: string) {
    const res = await apiClient.put(`/relative-patient/patients/${patientId}/medications/${medicationId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa thuốc của bệnh nhân
  async deletePatientMedication(patientId: string, medicationId: string, token: string) {
    const res = await apiClient.delete(`/relative-patient/patients/${patientId}/medications/${medicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Kiểm tra quyền của người thân
  async checkRelativePermissions(patientId: string, token: string) {
    const res = await apiClient.get(`/relative-patient/patients/${patientId}/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật permissions cho mối quan hệ
  async updateRelativePermissions(linkId: string, permissions: string[], token: string) {
    const res = await apiClient.put(`/relative-patient/relationship/${linkId}/permissions`, { permissions }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Fix permissions cho các mối quan hệ đã tồn tại
  async fixExistingPermissions(token: string) {
    const res = await apiClient.post('/relative-patient/fix-permissions', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Test authentication
  async testAuth(token: string) {
    const res = await apiClient.get('/relative-patient/test-auth', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Fix permissions cho một mối quan hệ cụ thể
  async quickFixPermissions(patientId: string, token: string) {
    const res = await apiClient.post(`/relative-patient/patients/${patientId}/fix-permissions`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  
}

export default new RelativePatientService();
