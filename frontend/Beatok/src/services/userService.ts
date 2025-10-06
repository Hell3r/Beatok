import api from './api';

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
};