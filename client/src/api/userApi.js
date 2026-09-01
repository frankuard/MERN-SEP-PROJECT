import axiosInstance from './axiosInstance';

const userApi = {
  getUserProfile: async (userId) => {
    const res = await axiosInstance.get(`/users/${userId}`);
    return res.data.user;
  },
  updateProfile: async (payload) => {
    const res = await axiosInstance.patch('/users/me', payload);
    return res.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await axiosInstance.patch('/users/me/password', { currentPassword, newPassword });
    return res.data;
  },
};

export default userApi;