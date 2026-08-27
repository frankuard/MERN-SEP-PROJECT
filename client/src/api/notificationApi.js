import axiosInstance from './axiosInstance';

const notificationApi = {
  // GET /api/notifications?page=1&limit=20
  getMyNotifications: async (page = 1, limit = 20) => {
    const res = await axiosInstance.get('/notifications', { params: { page, limit } });
    // Backend schema field is `read`, frontend has always used `isRead` —
    // normalize here so Context/Bell never need to know about the mismatch.
    return {
      ...res.data,
      notifications: Array.isArray(res.data?.notifications)
        ? res.data.notifications.map((n) => ({ ...n, isRead: n.read }))
        : res.data?.notifications,
    };
  },

  // GET /api/notifications/unread-count
  getUnreadCount: async () => {
    const res = await axiosInstance.get('/notifications/unread-count');
    return res.data;
  },

  // PATCH /api/notifications/:id/read
  markAsRead: async (id) => {
    const res = await axiosInstance.patch(`/notifications/${id}/read`);
    return res.data;
  },

  // PATCH /api/notifications/read-all
  markAllAsRead: async () => {
    const res = await axiosInstance.patch('/notifications/read-all');
    return res.data;
  },

  // DELETE /api/notifications/:id
  deleteNotification: async (id) => {
    const res = await axiosInstance.delete(`/notifications/${id}`);
    return res.data;
  },
};

export default notificationApi;