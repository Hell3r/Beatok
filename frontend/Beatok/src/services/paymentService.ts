const API_URL = 'http://185.55.59.6:8000';

interface PaymentCreateRequest {
  amount: number;
  description?: string;
}

interface PaymentResponse {
  id: number;
  amount: number;
  payment_url: string;
  payment_id: string;
  status: string;
}

export const paymentService = {
  async createPayment(data: PaymentCreateRequest): Promise<PaymentResponse> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/payment/tpay/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка при создании платежа');
    }

    return response.json();
  },
};
