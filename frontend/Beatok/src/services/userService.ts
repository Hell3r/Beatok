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

async updateUserProfile(data: any) {
  const token = localStorage.getItem('access_token');
  
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

  console.log('Sending update data:', formattedData);

  const response = await fetch(`http://localhost:8000/v1/users/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formattedData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update profile');
  }

  return await response.json();
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

  async getUserHistory(userId: number) {
    const response = await api.get(`/v1/users/${userId}/history`);
    return response.data;
  },
};