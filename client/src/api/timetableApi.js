import axiosInstance from './axiosInstance';
import { TIMETABLE_ROUTINE, INITIAL_RTE_SCHEDULE_CHANGES } from '../data/studentDashboardData';

/**
 * Timetable & Official RTE Schedule Changes API Service
 */
export const timetableApi = {
  // GET /api/timetable
  getTimetable: async (params = {}) => {
    try {
      const queryStr = typeof params === 'string' ? `?group=${params}` : `?format=grouped`;
      const res = await axiosInstance.get(`/timetable${queryStr}`);
      return res.data;
    } catch {
      return TIMETABLE_ROUTINE;
    }
  },

  // GET /api/timetable/:id
  getClassById: async (id) => {
    try {
      const res = await axiosInstance.get(`/timetable/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // POST /api/timetable (Admin/Staff)
  createClass: async (payload) => {
    try {
      const res = await axiosInstance.post('/timetable', payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // PUT /api/timetable/:id (Admin/Staff)
  updateClass: async (id, payload) => {
    try {
      const res = await axiosInstance.put(`/timetable/${id}`, payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // DELETE /api/timetable/:id (Admin/Staff)
  deleteClass: async (id) => {
    try {
      const res = await axiosInstance.delete(`/timetable/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // GET /api/schedule-changes
  getScheduleChanges: async () => {
    try {
      const res = await axiosInstance.get('/schedule-changes');
      return res.data;
    } catch {
      return INITIAL_RTE_SCHEDULE_CHANGES;
    }
  },
};

export default timetableApi;
