import axiosInstance from './axiosInstance';
import { INITIAL_LOST_FOUND } from '../data/studentDashboardData';

/**
 * Lost & Found Service & Endpoints
 */
export const lostFoundApi = {
  // Get all lost & found items
  getItems: async () => {
    try {
      const res = await axiosInstance.get('/lost-found');
      return res.data;
    } catch {
      return INITIAL_LOST_FOUND;
    }
  },

  // Report a lost/found item
  reportItem: async (itemData) => {
    try {
      const res = await axiosInstance.post('/lost-found', itemData);
      return res.data;
    } catch {
      return {
        id: `lf_${Date.now()}`,
        ...itemData,
        time: 'Just now',
        status: 'Unclaimed',
      };
    }
  },

  // Mark item as claimed
  claimItem: async (itemId) => {
    try {
      const res = await axiosInstance.patch(`/lost-found/${itemId}/claim`);
      return res.data;
    } catch {
      return { success: true, itemId, status: 'Claimed' };
    }
  },

  // Submit CCTV footage request
  submitCctvRequest: async (cctvData) => {
    try {
      const res = await axiosInstance.post('/lost-found/cctv-request', cctvData);
      return res.data;
    } catch {
      return {
        id: `cctv_${Date.now()}`,
        ...cctvData,
        status: 'In Review',
        submittedAt: 'Just now',
      };
    }
  },
};

export default lostFoundApi;
