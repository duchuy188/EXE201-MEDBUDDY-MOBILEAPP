import apiClient from './index';

export interface NotificationToken {
  _id?: string;
  userId: string;
  deviceToken: string;
  createdAt?: Date;
}

export interface NotificationHistory {
  _id?: string;
  userId: string;
  title: string;
  body: string;
  sentAt?: Date;
  deviceToken?: string;
}

class NotificationService {
  // Lưu token thiết bị
  async saveDeviceToken(data: NotificationToken, token: string) {
    const res = await apiClient.post('/notifications/token', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Gửi thông báo
  async sendNotification(data: {
    userId: string;
    title: string;
    body: string;
    deviceToken?: string;
  }, token: string) {
    const res = await apiClient.post('/notifications/send', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy lịch sử thông báo
  async getNotificationHistory(userId: string, token: string) {
    const res = await apiClient.get(`/notifications/history?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa token thiết bị
  async deleteDeviceToken(userId: string, deviceToken: string, token: string) {
    const res = await apiClient.delete(`/notifications/token`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { userId, deviceToken }
    });
    return res.data;
  }
}

export default new NotificationService();
