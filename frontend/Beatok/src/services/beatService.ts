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

  async getBeats(skip: number = 0, limit: number = 100): Promise<Beat[]> {
    return this.fetchApi(`/beats?skip=${skip}&limit=${limit}`);
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
}

export const beatService = new BeatService();
