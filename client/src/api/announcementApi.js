import axiosInstance from './axiosInstance';

export const announcementApi = {
  getAnnouncements: async (params = {}) => {
    const response = await axiosInstance.get('/announcements', { params });
    return response.data;
  },
};

export default announcementApi;