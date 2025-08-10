import apiClient from './index';

// Định nghĩa types cho Auth
export interface RegisterRequest {
  id?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string; // "relative" hoặc các role khác
  dateOfBirth: string; // thêm dòng này
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  token?: string;
  user?: any;
}

class AuthService {
  // API Register - Đăng ký người dùng mới
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      throw {
        success: false,
        message: error.response?.data?.message || 'Đăng ký thất bại',
        error: error.response?.data || error.message
      };
    }
  }

  // API Login - Đăng nhập với email và password
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw {
        success: false,
        message: error.response?.data?.message || 'Đăng nhập thất bại',
        error: error.response?.data || error.message
      };
    }
  }
}

// Export singleton instance
export default new AuthService();
