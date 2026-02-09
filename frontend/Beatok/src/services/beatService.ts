import type { Beat } from "../types/Beat";


const API_BASE_URL = 'http://localhost:8000';

export interface BeatsResponse {
  beats: Beat[];
  total: number;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface Tariff {
  id: number;
  name: string;
  display_name: string;
  description: string;
}

export interface BeatPricingCreate {
  beat_id: number;
  tariff_name: string;
  price: number;
  is_available: boolean;
}

export interface PurchaseBeatRequest {
  beat_id: number;
  tariff_name: string;
}

export interface PurchaseBeatResponse {
  success: boolean;
  purchase_id: number;
  beat_id: number;
  beat_name: string;
  tariff_name: string;
  tariff_type: string;
  amount: number;
  purchaser_balance_before: number;
  purchaser_balance_after: number;
  seller_balance_before: number;
  seller_balance_after: number;
  message: string;
  purchased_at: string;
}

class BeatService {
  private async fetchApi(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getBeats(skip: number = 0, limit: number = 100, authorId?: number): Promise<Beat[]> {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (authorId !== undefined) {
      params.append('author_id', authorId.toString());
    }
    const response = await this.fetchApi(`/beats?${params.toString()}`);
    return response;
  }

  async getBeatById(id: number): Promise<Beat> {
    return this.fetchApi(`/beats/${id}`);
  }

  async searchBeats(query: string, genre?: string): Promise<Beat[]> {
    const params = new URLSearchParams({ q: query });
    if (genre) params.append('genre', genre);

    return this.fetchApi(`/beats/search?${params.toString()}`);
  }

  async getBeatPricings(beatId: number) {
    return this.fetchApi(`/v1/pricing/${beatId}/pricings`);
  }

  async getUserBeats(userId: number): Promise<Beat[]> {
    return this.getBeats(0, 100, userId);
  }

  async getTariffs(): Promise<Tariff[]> {
    return this.fetchApi('/v1/tarrifs');
  }

  async createBeatPricing(pricing: BeatPricingCreate) {
    return this.fetchApi('/v1/pricing/', {
      method: 'POST',
      body: JSON.stringify(pricing),
    });
  }

  async getFavoriteBeats(): Promise<Beat[]> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Не авторизован');
    }

    const response = await this.fetchApi(`/v1/favorite`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response;
  }

  async deleteBeat(beatId: number): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Не авторизован');
    }

    const response = await fetch(`${API_BASE_URL}/beats/${beatId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при удалении бита' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  async toggleFavorite(beatId: number): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Не авторизован');
    }

    const response = await fetch(`${API_BASE_URL}/v1/favorite/${beatId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при добавлении в избранное' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  async removeFromFavorites(beatId: number): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Не авторизован');
    }

    const response = await fetch(`${API_BASE_URL}/v1/favorite/${beatId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при удалении из избранного' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  async getPromotedBeats(): Promise<Beat[]> {
    const response = await this.fetchApi('/beats?promotion_status=promoted&limit=3');
    return response;
  }

  async purchaseBeat(request: PurchaseBeatRequest): Promise<PurchaseBeatResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Не авторизован');
    }

    const response = await fetch(`${API_BASE_URL}/purchase/beat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при покупке бита' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

export const beatService = new BeatService();
