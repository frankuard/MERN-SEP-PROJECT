import axiosInstance from './axiosInstance';
import { TIMETABLE_ROUTINE, INITIAL_RTE_SCHEDULE_CHANGES } from '../data/studentDashboardData';

/**
 * Timetable & Official RTE Schedule Changes API Service
 */
export const timetableApi = {
  // GET /api/timetable
  getTimetable: async (group = 'default') => {
    try {
      const res = await axiosInstance.get(`/timetable?group=${group}`);
      return res.data;
    } catch {
      return TIMETABLE_ROUTINE;
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
