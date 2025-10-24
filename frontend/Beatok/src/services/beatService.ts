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
}

export const beatService = new BeatService();
