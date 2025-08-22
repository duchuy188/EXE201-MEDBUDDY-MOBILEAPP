import apiClient from './index';

class OrcService {
	// Gửi ảnh toa thuốc để nhận diện ký tự quang học (OCR)
	async recognizePrescription(image: File, token?: string) {
		const formData = new FormData();
		formData.append('image', image);
		const headers: any = {
			'Content-Type': 'multipart/form-data',
		};
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
		const res = await apiClient.post('/ocr', formData, { headers });
		return res.data;
	}
}

export default new OrcService();
