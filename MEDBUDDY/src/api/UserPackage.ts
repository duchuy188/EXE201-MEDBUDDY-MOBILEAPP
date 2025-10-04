import apiClient from './index';

// Interface cho Package
export interface Package {
  _id: string;
  name: string;
  price: number;
  duration: number;
  unit: 'days' | 'months' | 'years';
  features: string[];
}

// Interface cho Active Package
export interface ActivePackage {
  package: Package;
  startDate: string;
  endDate: string;
  features: string[];
  isActive: boolean;
  daysRemaining: number;
  formattedStartDate: string;
  formattedEndDate: string;
}

// Interface cho Package History
export interface PackageHistory {
  orderCode: string;
  package: Package;
  amount: number;
  paidAt: string;
  formattedPaidAt: string;
  status: string;
}

// Interface cho Feature Access Check
export interface FeatureAccessCheck {
  message: string;
  hasAccess: boolean;
  feature: string;
}

class UserPackageService {
  
  // Lấy gói active của user hiện tại
  async getMyActivePackage(token: string) {
    const res = await apiClient.get('/user-package/my-package', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Kiểm tra quyền sử dụng feature
  async checkFeatureAccess(feature: string, token: string) {
    const res = await apiClient.get(`/user-package/check-feature/${feature}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy lịch sử gói của user
  async getMyPackageHistory(token: string) {
    const res = await apiClient.get('/user-package/my-history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new UserPackageService();