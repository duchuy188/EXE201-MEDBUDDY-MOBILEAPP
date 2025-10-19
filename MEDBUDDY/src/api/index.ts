import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL của API backend
const BASE_URL = 'https://exe201-medbuddy-backend.onrender.com'; //rendren
// const BASE_URL = 'http://10.0.2.2:4000';  //loaclhost android
// const BASE_URL = 'http://172.25.208.1:4000';  // IP máy tính thật cho điện thoại

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
    
    const originalRequest = error.config;
    
    // Xử lý các lỗi phổ biến
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Token expired hoặc unauthorized
      console.log('Token expired - attempting refresh...');
      originalRequest._retry = true;
      
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Sửa URL refresh token
          const res = await axios.post(`${BASE_URL}/api/auth/refresh-token`, { 
            refreshToken 
          });
          
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;
          
          // Lưu token mới
          await AsyncStorage.setItem('token', newAccessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
          }
          
          // Retry request với token mới
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log('Token refreshed successfully, retrying request...');
          
          return apiClient.request(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          
          // Refresh token cũng expired, clear storage và redirect login
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('userId');
          await AsyncStorage.removeItem('deviceToken');
          
          // Có thể emit event để redirect về login
          // NavigationService.navigate('Login');
          console.log('Refresh token expired - need to login again');
        }
      } else {
        console.log('No refresh token found');
        await AsyncStorage.clear();
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
