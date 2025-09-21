import apiClient from './index';

export interface RelativePatient {
  _id?: string;
  patient: string;
  relative: string;
  status: 'pending' | 'accepted' | 'rejected';
  otp?: string;
  otpExpiresAt?: Date;
  createdAt?: string;
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
}

export default new RelativePatientService();
