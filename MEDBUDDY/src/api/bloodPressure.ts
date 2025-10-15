import apiClient from './index';

export interface BloodPressure {
  _id?: string;
  userId: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  measuredAt?: string;
  note?: string;
}

class BloodPressureService {
  // Ghi nhận chỉ số huyết áp
  async addBloodPressure(data: Omit<BloodPressure, '_id'>, token: string) {
    const res = await apiClient.post('/api/blood-pressure', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy lịch sử huyết áp
  async getBloodPressureHistory(token: string) {
    const res = await apiClient.get('/api/blood-pressure', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy lần đo huyết áp mới nhất
  async getLatestBloodPressure(token: string) {
    const res = await apiClient.get('/api/blood-pressure/latest', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa lần đo huyết áp
  async deleteBloodPressure(id: string, token: string) {
    const res = await apiClient.delete(`/api/blood-pressure/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Phân tích BP gần nhất với Gemini AI (không cần tham số)
  async analyzeLatestBP(token: string) {
    const res = await apiClient.post('/api/blood-pressure/ai/analyze', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Phân tích BP cụ thể với Gemini AI (cần bloodPressureId)
  async analyzeSpecificBP(bloodPressureId: string, token: string) {
    const res = await apiClient.post(`/api/blood-pressure/ai/analyze-specific/${bloodPressureId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy AI insights tổng hợp của user (có thể thêm limit)
  async getAIInsights(userId: string, token: string, limit: number = 10) {
    const res = await apiClient.get(`/api/blood-pressure/ai/insights/${userId}?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new BloodPressureService();