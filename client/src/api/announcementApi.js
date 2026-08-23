import axiosInstance from './axiosInstance';

export const announcementApi = {
  getAnnouncements: async (params = {}) => {
    const response = await axiosInstance.get('/announcements', { params });
    return response.data;
  },

  createAnnouncement: async (payload) => {
    const response = await axiosInstance.post('/announcements', payload);
    return response.data;
  },

  updateAnnouncement: async (id, payload) => {
    const response = await axiosInstance.patch(`/announcements/${id}`, payload);
    return response.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await axiosInstance.delete(`/announcements/${id}`);
    return response.data;
  },
};

export default announcementApi;