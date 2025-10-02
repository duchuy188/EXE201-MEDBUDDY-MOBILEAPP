import apiClient from './index';

// Kiểu dữ liệu Payment
export interface Payment {
  orderCode: number;
  userId: string;
  packageId: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  paymentMethod?: string;
  paymentUrl?: string;
  paidAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  payosData?: any;
  createdAt?: string;
}

// Tạo link thanh toán
export async function createPaymentLink(packageId: string, token: string) {
  const res = await apiClient.post('/payos/create-payment', { packageId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Xác nhận thanh toán
export async function confirmPayment(orderCode: number, token: string) {
  const res = await apiClient.post('/payos/confirm-payment', { orderCode }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Lấy thông tin payment link
export async function getPaymentInfo(orderCode: number, token: string) {
  const res = await apiClient.get(`/payos/payment-info/${orderCode}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Webhook nhận thông báo từ PayOS
export async function payosWebhook(data: any) {
  const res = await apiClient.post('/payos/webhook', data);
  return res.data;
}

// Return URL - xử lý khi thanh toán thành công
export async function payosReturn(token: string) {
  const res = await apiClient.get('/payos/return', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Cancel URL - xử lý khi hủy thanh toán
export async function payosCancel(token: string) {
  const res = await apiClient.get('/payos/cancel', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
