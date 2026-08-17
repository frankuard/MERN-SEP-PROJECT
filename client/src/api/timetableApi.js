import axiosInstance from './axiosInstance';
import { L4CG3_TIMETABLE_ROUTINE, INITIAL_RTE_SCHEDULE_CHANGES } from '../data/studentDashboardData';

/**
 * Timetable & Official RTE Schedule Changes API Service
 */
export const timetableApi = {
  // GET /api/timetable or /api/timetable/l4cg3
  getTimetable: async (group = 'L4CG3') => {
    try {
      const res = await axiosInstance.get(`/timetable?group=${group}`);
      return res.data;
    } catch {
      return L4CG3_TIMETABLE_ROUTINE;
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
