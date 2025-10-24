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
    const formattedData = { ...data };

    if (formattedData.birthday) {
      if (formattedData.birthday instanceof Date) {
        formattedData.birthday = formattedData.birthday.toISOString().split('T')[0];
      } else if (typeof formattedData.birthday === 'string') {
        if (formattedData.birthday.includes('T')) {
          formattedData.birthday = formattedData.birthday.split('T')[0];
        }
      }
    }

    console.log('Sending formatted data:', formattedData);

    const response = await api.put(`/v1/users/${userId}`, formattedData);
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

  async getUserStats(userId: number) {
    const response = await api.get(`/v1/users/${userId}/stats`);
    return response.data;
  },
};