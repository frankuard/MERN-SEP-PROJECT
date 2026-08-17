import axiosInstance from './axiosInstance';
import { INITIAL_CAMPUS_HELP } from '../data/studentDashboardData';

/**
 * Campus Help & Peer Requests Service & Endpoints
 */
export const campusHelpApi = {
  // Get all peer help requests
  getHelpRequests: async () => {
    try {
      const res = await axiosInstance.get('/campus-help/requests');
      return res.data;
    } catch {
      return INITIAL_CAMPUS_HELP;
    }
  },

  // Post a new peer help request
  submitHelpRequest: async (requestText, author = 'Suraj Poddar') => {
    try {
      const res = await axiosInstance.post('/campus-help/requests', { request: requestText });
      return res.data;
    } catch {
      return {
        id: `ch_${Date.now()}`,
        request: requestText.trim(),
        author,
        sem: 'Current Student',
        replies: 0,
        time: 'Just now',
      };
    }
  },
};

export default campusHelpApi;
