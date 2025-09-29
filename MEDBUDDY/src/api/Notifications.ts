import apiClient from './index';

export interface NotificationHistory {
  _id?: string;
  userId: string;
  title: string;
  body: string;
  deviceToken: string;
  sentAt: string;
  sound?: string;
}

export interface SendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  sound?: string;
}

export interface SaveTokenRequest {
  userId: string;
  deviceToken: string;
}

class NotificationService {
  // Lưu token thiết bị
  async saveToken(data: SaveTokenRequest, token: string) {
    const res = await apiClient.post('/notifications/token', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Gửi thông báo nhắc uống thuốc
  async sendNotification(data: SendNotificationRequest, token: string) {
    const res = await apiClient.post('/notifications/send', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa token khi logout
  async deleteToken(data: SaveTokenRequest, token: string) {
const res = await apiClient.post('/notifications/delete-token', data, {
  headers: { Authorization: `Bearer ${token}` },
});
    return res.data;
  }

  // Lấy lịch sử thông báo đã gửi
  async getNotificationHistory(userId: string, token: string) {
    const res = await apiClient.get(`/notifications/history?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new NotificationService();