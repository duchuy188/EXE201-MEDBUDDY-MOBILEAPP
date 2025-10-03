import apiClient from './index';

export interface MedicationTime {
  time: 'Sáng' | 'Chiều' | 'Tối';
  dosage: string;
}

export interface Medication {
  _id?: string;
  userId: string;
  name: string;
  quantity?: string;
  form?: string;
  image?: string;
  note?: string;
  times: MedicationTime[]; // Mảng các buổi uống và liều lượng
  expirationDate?: string;
  createdAt?: string;
  createdBy?: string; // ID của người tạo thuốc (ObjectId reference to User)
  createdByType?: 'patient' | 'relative'; // Loại người tạo
}

class MedicationService {
  // Lấy danh sách thuốc
  async getMedications(token: string) {
    const res = await apiClient.get('/medications', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Thêm thuốc mới
  async addMedication(data: Omit<Medication, '_id' | 'createdAt'>, token: string) {
    const res = await apiClient.post('/medications', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xem chi tiết thuốc
  async getMedicationById(id: string, token: string) {
    const res = await apiClient.get(`/medications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật thông tin thuốc
  async updateMedication(id: string, data: Partial<Medication>, token: string) {
    const res = await apiClient.put(`/medications/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Xóa thuốc
  async deleteMedication(id: string, token: string) {
    const res = await apiClient.delete(`/medications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export default new MedicationService();

// Kiểu dữ liệu cho thuốc từ OCR
export interface MedicationFromOCR {
  name: string;
  form?: string;
  usage?: string;
  times?: MedicationTime[]; // Thêm trường times cho OCR
}

export interface SaveMedicationsFromOCRRequest {
  userId: string;
  medicines: MedicationFromOCR[];
  imageUrl: string;
  rawText: string;
}

class MedicationServiceWithOCR extends MedicationService {
  // Lưu nhiều thuốc từ kết quả OCR
  async saveMedicationsFromOCR(data: SaveMedicationsFromOCRRequest, token: string) {
    const res = await apiClient.post('/medications/from-ocr', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
}

export const medicationServiceWithOCR = new MedicationServiceWithOCR();