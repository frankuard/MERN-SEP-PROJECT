import axiosInstance from './axiosInstance';

/**
 * Events Service & Endpoints
 * Backend source of truth: GET /events (optional ?type=college|community)
 */
export const eventsApi = {
  // Fetch events, optionally filtered by type ('college' | 'community').
  // Pass null/undefined for all events.
  getEvents: async (type = null) => {
    const response = await axiosInstance.get('/events', {
      params: type ? { type } : {},
    });
    return response.data;
  },
};

export default eventsApi;