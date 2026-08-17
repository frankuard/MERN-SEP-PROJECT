import axiosInstance from './axiosInstance';
import {
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_VOLUNTEERING_HISTORY,
  INITIAL_VOLUNTEER_REQUESTS
} from '../data/studentDashboardData';

/**
 * Student Services Department (SSD) Service & Endpoints
 */
export const ssdHelpApi = {
  // Get attendance logs and statistics
  getAttendanceData: async () => {
    try {
      const res = await axiosInstance.get('/ssd/attendance');
      return res.data;
    } catch {
      return {
        percentage: 87,
        presentCount: 42,
        absentCount: 6,
        records: INITIAL_ATTENDANCE_RECORDS,
      };
    }
  },

  // Record daily check-in attendance
  logDailyAttendance: async (room = 'SR01 Wolves') => {
    try {
      const res = await axiosInstance.post('/ssd/attendance/check-in', { room });
      return res.data;
    } catch {
      return {
        success: true,
        record: { date: 'Today (Aug 17)', status: 'Present', time: '09:45 AM', room },
      };
    }
  },

  // Request official stamped attendance report
  requestAttendanceReport: async (payload) => {
    try {
      const res = await axiosInstance.post('/ssd/attendance/request-report', payload);
      return res.data;
    } catch {
      return { success: true, message: 'Report request submitted to SSD', payload };
    }
  },

  // Get volunteering history
  getVolunteeringHistory: async () => {
    try {
      const res = await axiosInstance.get('/ssd/volunteering/history');
      return res.data;
    } catch {
      return INITIAL_VOLUNTEERING_HISTORY;
    }
  },

  // Get upcoming event volunteer requests
  getVolunteerRequests: async () => {
    try {
      const res = await axiosInstance.get('/ssd/volunteering/opportunities');
      return res.data;
    } catch {
      return INITIAL_VOLUNTEER_REQUESTS;
    }
  },

  // Apply or withdraw for volunteer opportunity
  applyVolunteerOpportunity: async (requestId, isApplying) => {
    try {
      const res = await axiosInstance.post(`/ssd/volunteering/opportunities/${requestId}/apply`, { apply: isApplying });
      return res.data;
    } catch {
      return { success: true, requestId, applied: isApplying };
    }
  },
};

export default ssdHelpApi;
