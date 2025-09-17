import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Base URL của API backend
// const BASE_URL = 'https://exe201-medbuddy-backend.onrender.com'; //rendren
const BASE_URL = 'http://10.0.2.2:5000';  //loaclhost android

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
  (config) => {
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
  (error) => {
    console.error('Response Error:', error.response?.data || error.message);
    
    // Xử lý các lỗi phổ biến
    if (error.response?.status === 401) {
      // Token expired hoặc unauthorized
      console.log('Unauthorized access - might need to login again');
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
