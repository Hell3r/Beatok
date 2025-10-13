import api from './api';

export interface SupportRequest {
  problem_type: string;
  title: string;
  description: string;
}

export const requestService = {
  async createSupportRequest(requestData: SupportRequest): Promise<any> {
    try {
      const response = await api.post('/v1/requests/', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating support request:', error);
      throw error;
    }
  },

  async getUserRequests(): Promise<any[]> {
    try {
      const response = await api.get('/v1/requests/my-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching user requests:', error);
      throw error;
    }
  },

  async getAllRequests(): Promise<any[]> {
    try {
      const response = await api.get('/v1/requests/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all requests:', error);
      throw error;
    }
  }
};