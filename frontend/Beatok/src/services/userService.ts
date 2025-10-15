import api from './api';

export interface TopBeatmaker {
  user_id: number;
  username: string;
  avatar_path: string;
  beat_count: number;
}

export interface Beatmaker {
  id: number;
  username: string;
  email: string;
  birthday: string;
  is_active: boolean;
  role: string;
  avatar_path: string;
  beat_count: number;
}

export const userService = {
  async getUserProfile(userId: number) {
    const response = await api.get(`/v1/users/${userId}`);
    return response.data;
  },

  async updateUserProfile(userId: number, data: any) {
    const response = await api.put(`/v1/users/${userId}`, data);
    return response.data;
  },

  async uploadAvatar(userId: number, formData: FormData) {
    const response = await api.post(`/v1/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getTopBeatmakers(limit: number = 10): Promise<TopBeatmaker[]> {
    const response = await api.get(`/beats/top-beatmakers?limit=${limit}`);
    return response.data;
  },

  async getAllBeatmakers(): Promise<Beatmaker[]> {
    const response = await api.get('/beats/beatmakers');
    return response.data;
  },
};
