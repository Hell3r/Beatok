import type { Beat } from "../types/Beat";
import api from './api';

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

  async getBeats(skip: number = 0, limit: number = 100, authorId?: number): Promise<Beat[]> {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (authorId !== undefined) {
      params.append('author_id', authorId.toString());
    }
    const { data } = await api.get(`/beats/?${params.toString()}`);
    console.log(data);
    return data;
  }

  async getBeatById(id: number): Promise<Beat> {
    const { data } = await api.get(`/beats/${id}`);
    return data;
  }

  async searchBeats(query: string, genre?: string): Promise<Beat[]> {
    const params = new URLSearchParams({ q: query });
    if (genre) params.append('genre', genre);

    const { data } = await api.get(`/beats/search?${params.toString()}`);
    return data;
  }

  async getBeatPricings(beatId: number) {
    const { data } = await api.get(`/v1/pricing/${beatId}/pricings`);
    return data;
  }

  async getUserBeats(userId: number): Promise<Beat[]> {
    return this.getBeats(0, 100, userId);
  }

  async getTariffs(): Promise<Tariff[]> {
    const { data } = await api.get('/v1/tarrifs/');
    console.log(data);
    return data;
  }

  async createBeatPricing(pricing: BeatPricingCreate) {
    const { data } = await api.post('/v1/pricing/', pricing);
    return data;
  }

  async getFavoriteBeats(): Promise<Beat[]> {
    const { data } = await api.get('/v1/favorite');
    return data;
  }

async deleteBeat(beatId: number): Promise<void> {
    await api.delete(`/beats/${beatId}`);
  }

async toggleFavorite(beatId: number): Promise<void> {
    await api.post(`/v1/favorite/${beatId}`);
  }

async removeFromFavorites(beatId: number): Promise<void> {
    await api.delete(`/v1/favorite/${beatId}`);
  }

  async getPromotedBeats(): Promise<Beat[]> {
    const { data } = await api.get('/beats/?promotion_status=promoted&limit=10');
    return data;
  }

async purchaseBeat(request: PurchaseBeatRequest): Promise<PurchaseBeatResponse> {
    const { data } = await api.post('/purchase/beat', request);
    return data;
  }

async promoteBeat(beatId: number): Promise<{
    success: boolean;
    message: string;
    beat_id: number;
    beat_name: string;
    price: number;
    ends_at: string;
    new_balance: number;
    promotion_id: number;
  }> {
    const { data } = await api.post('/promotion/promote', { beat_id: beatId });
    return data;
  }
}

export const beatService = new BeatService();
