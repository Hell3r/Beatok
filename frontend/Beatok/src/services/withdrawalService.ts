const API_URL = 'http://localhost:8000';

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
};
