
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
    let body: any = data;
    let headers: any = { Authorization: `Bearer ${token}` };
    // Nếu có avatar là file local (uri), gửi multipart/form-data
    if (data.avatar && typeof data.avatar === 'string' && !data.avatar.startsWith('http')) {
      body = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'avatar' && value) {
          body.append('avatar', {
            uri: value,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          } as any);
        } else if (value !== undefined) {
          body.append(key, value);
        }
      });
      headers['Content-Type'] = 'multipart/form-data';
    }
    const res = await apiClient.put('/api/users/profile', body, { headers });
    return res.data;
  }

  // Đổi mật khẩu
  async changePassword(currentPassword: string, newPassword: string, confirmNewPassword: string, token: string) {
    const res = await apiClient.post('/api/users/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword,
    }, {
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
