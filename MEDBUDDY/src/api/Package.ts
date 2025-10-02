import apiClient from './index';

export interface Package {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  unit: 'day' | 'month' | 'year';
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}

class PackageService {
  // Lấy danh sách tất cả các gói dịch vụ
  async getAllPackages(token: string) {
    const res = await apiClient.get('/package', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data; // Trả về mảng data luôn
  }

  async activateTrialPackage(packageId: string, token: string) {
    const res = await apiClient.post('/payos/activate-trial', { packageId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
}

export default new PackageService();