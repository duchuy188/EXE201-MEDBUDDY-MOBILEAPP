import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL của API backend
// const BASE_URL = 'https://exe201-medbuddy-backend.onrender.com'; //rendren
const BASE_URL = 'http://10.0.2.2:4000';  //loaclhost android
// const BASE_URL = 'http://192.168.102.8:4000';  // IP máy tính thật cho điện thoại

// Tạo instance axios với cấu hình cơ bản
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor để xử lý request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log request để debug (có thể tắt trong production)
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response để debug (có thể tắt trong production)
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('Response Error:', error.response?.data || error.message);
    
    // Xử lý các lỗi phổ biến
    if (error.response?.status === 401) {
      // Token expired hoặc unauthorized
      console.log('Unauthorized access - might need to login again');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post('YOUR_API_URL/api/auth/refresh-token', { refreshToken });
          const newAccessToken = res.data.accessToken;
          await AsyncStorage.setItem('token', newAccessToken);
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient.request(error.config);
        } catch (err) {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('refreshToken');
          // Có thể điều hướng về màn hình đăng nhập ở đây
        }
      }
    } else if (error.response?.status === 404) {
      console.log('API endpoint not found');
    } else if (error.response?.status >= 500) {
      console.log('Server error');
    }
    
    return Promise.reject(error);
  }
);

// Export API client và services
export default apiClient;
export { default as AuthService } from './authService';
