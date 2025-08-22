
import apiClient from './index';

export interface User {
  _id?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password?: string;
  role: 'relative' | 'patient' | 'admin';
  dateOfBirth: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

class UserService {
  // Lấy thông tin profile của chính mình
  async getProfile(token: string) {
    const res = await apiClient.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật profile (không sửa role)
  async updateProfile(data: Partial<Omit<User, 'role' | '_id'>>, token: string) {
    const res = await apiClient.put('/api/users/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Đổi mật khẩu
  async changePassword(oldPassword: string, newPassword: string, token: string) {
    const res = await apiClient.post('/api/users/change-password', { oldPassword, newPassword }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa avatar
  async removeAvatar(token: string) {
    const res = await apiClient.post('/api/users/remove-avatar', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy dashboard user (test role)
  async getDashboard(token: string) {
    const res = await apiClient.get('/api/users/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new UserService();
