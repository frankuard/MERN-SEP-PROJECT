import axiosInstance from './axiosInstance';
import { INITIAL_COLLEGE_EVENTS, INITIAL_COMMUNITY_EVENTS } from '../data/studentDashboardData';

/**
 * Events Service & Endpoints
 */
export const eventsApi = {
  // Fetch official college events
  getCollegeEvents: async () => {
    try {
      const res = await axiosInstance.get('/events/college');
      return res.data;
    } catch {
      return INITIAL_COLLEGE_EVENTS;
    }
  },

  // Toggle registration for college event
  registerCollegeEvent: async (eventId, isRegistering) => {
    try {
      const res = await axiosInstance.post(`/events/college/${eventId}/register`, { register: isRegistering });
      return res.data;
    } catch {
      return { success: true, eventId, registered: isRegistering };
    }
  },

  // Fetch community club events
  getCommunityEvents: async () => {
    try {
      const res = await axiosInstance.get('/events/community');
      return res.data;
    } catch {
      return INITIAL_COMMUNITY_EVENTS;
    }
  },

  // Toggle join community event
  joinCommunityEvent: async (eventId, isJoining) => {
    try {
      const res = await axiosInstance.post(`/events/community/${eventId}/join`, { join: isJoining });
      return res.data;
    } catch {
      return { success: true, eventId, joined: isJoining };
    }
  },
};

export default eventsApi;
