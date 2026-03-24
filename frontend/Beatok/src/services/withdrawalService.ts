const API_URL = 'https://beatokservice.ru/api';

interface WithdrawalCreateRequest {
  amount: number;
  card_number: string;
  description?: string;
}

interface WithdrawalResponse {
  id: number;
  amount: number;
  status: string;
  card_number: string;
  created_at: string;
}

interface WithdrawalAdminResponse {
  id: number;
  user_id: number;
  username: string;
  email: string;
  amount: number;
  status: string;
  card_number: string;
  description?: string;
  created_at: string;
  paid_at?: string;
}

export const withdrawalService = {
  async createWithdrawal(data: WithdrawalCreateRequest): Promise<WithdrawalResponse> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/withdrawal/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка при создании запроса на вывод');
    }

    return response.json();
  },

  async getPendingWithdrawals(): Promise<WithdrawalAdminResponse[]> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/withdrawal/admin/pending`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка при получении списка выводов');
    }

    return response.json();
  },

  async approveWithdrawal(withdrawalId: number): Promise<WithdrawalAdminResponse> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/withdrawal/admin/${withdrawalId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка при подтверждении вывода');
    }

    return response.json();
  },
};

