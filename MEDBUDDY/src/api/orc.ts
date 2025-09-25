import apiClient from './index';

class OrcService {
	// Gửi ảnh toa thuốc để nhận diện ký tự quang học (OCR)
	// image: { uri, name, type }
	async recognizePrescription(image: { uri: string, name: string, type: string }, token?: string) {
		const formData = new FormData();
	console.log('Token gửi lên backend:', token);
		formData.append('image', image as any);
		const headers: any = {
			'Content-Type': 'multipart/form-data',
		};
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	const res = await apiClient.post('/ocr', formData, { headers, timeout: 30000 });
		return res.data;
	}
}

export default new OrcService();
