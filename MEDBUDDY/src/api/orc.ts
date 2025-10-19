import apiClient from './index';

class OcrService {
  // Gửi ảnh toa thuốc để nhận diện ký tự quang học (OCR)
  // Yêu cầu feature OCR
  // image: { uri, name, type }
  async recognizePrescription(
    image: { uri: string; name: string; type: string }, 
    token: string
  ) {
    const formData = new FormData();
    console.log('Token gửi lên backend:', token);
    formData.append('image', image as any);
    
    const headers: any = {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`,
    };

    const res = await apiClient.post('/ocr', formData, { 
      headers, 
      timeout: 60000
    });
    return res.data;
  }

  // Test kết nối Cloudinary
  async testCloudinary() {
    const res = await apiClient.get('/ocr/test-cloudinary');
    return res.data;
  }
}

export default new OcrService();