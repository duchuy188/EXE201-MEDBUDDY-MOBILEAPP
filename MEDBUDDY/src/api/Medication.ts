import apiClient from './index';

export interface MedicationTime {
  time: 'Sáng' | 'Chiều' | 'Tối';
  dosage: string;
}

export interface Medication {
  _id?: string;
  userId: string;
  name: string;
  form?: string;
  image?: string;
  note?: string;
  quantity?: string; // Liều lượng mỗi lần uống (giữ lại cho tương thích)
  totalQuantity?: number; // Tổng số lượng ban đầu
  remainingQuantity?: number; // Số lượng còn lại hiện tại
  lowStockThreshold?: number; // Ngưỡng cảnh báo sắp hết
  isLowStock?: boolean; // Có sắp hết không
  lastRefillDate?: string; // Ngày mua thêm gần nhất
  times: MedicationTime[]; // Mảng các buổi uống và liều lượng
  expirationDate?: string;
  createdAt?: string;
  createdBy?: string; // ID của người tạo thuốc (ObjectId reference to User)
  createdByType?: 'patient' | 'relative'; // Loại người tạo
}

// Interface cho request thêm thuốc mới
export interface AddMedicationRequest {
  name: string;
  form?: string;
  note?: string;
  totalQuantity: number;
  remainingQuantity: number;
  lowStockThreshold: number;
  isLowStock?: boolean;
  lastRefillDate?: string;
  userId: string;
  times: MedicationTime[];
  expirationDate?: string;
  createdBy?: string;
  createdByType?: 'patient' | 'relative';
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
  async addMedication(data: AddMedicationRequest, token: string) {
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


  // Xóa thuốc
  async deleteMedication(id: string, token: string) {
    const res = await apiClient.delete(`/medications/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Lấy danh sách thuốc sắp hết
  async getLowStockMedications(token: string) {
    const res = await apiClient.get('/medications/low-stock', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  // Cập nhật thông tin thuốc (đa năng - gộp update + mua thêm + đặt ngưỡng)
  async updateMedication(id: string, data: {
    name?: string;
    note?: string;
    addedQuantity?: number;
    lowStockThreshold?: number;
    totalQuantity?: number;
    remainingQuantity?: number;
  }, token: string) {
    const res = await apiClient.put(`/medications/${id}`, data, {
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
  imageUrl: string; // Sửa lại kiểu này
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