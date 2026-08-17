import axiosInstance from './axiosInstance';
import { CLASSROOM_POOL } from '../data/studentDashboardData';

/**
 * Vacant Classrooms Service & Endpoints
 */
export const vacantClassesApi = {
  // Get all classroom statuses
  getClassrooms: async () => {
    try {
      const res = await axiosInstance.get('/classrooms/vacant');
      return res.data;
    } catch {
      return CLASSROOM_POOL;
    }
  },

  // Request or update classroom permission
  requestPermission: async (roomId, currentStatus) => {
    try {
      const res = await axiosInstance.post(`/classrooms/${roomId}/permission`, { status: currentStatus });
      return res.data;
    } catch {
      let nextStatus = 'pending';
      if (currentStatus === 'pending') nextStatus = 'approved';
      else if (currentStatus === 'approved') nextStatus = 'vacant';
      return { success: true, roomId, nextStatus };
    }
  },
};

export default vacantClassesApi;
