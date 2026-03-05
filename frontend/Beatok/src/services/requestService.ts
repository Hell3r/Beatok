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
      console.log('✅ getAllRequests response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getAllRequests error:', error);
      if (error) {
        console.error('Response data:', error);
      } else if (error) {
        console.error('No response received:', error);
      } else {
        console.error('Request error:', error);
      }
      throw error;
    }
  },

  async respondToRequest(requestId: number, response: string): Promise<any> {
    try {
      const responseData = await api.patch(`/v1/requests/${requestId}/respond`, { response });
      return responseData.data;
    } catch (error) {
      console.error('Error responding to request:', error);
      throw error;
    }
  }
};
