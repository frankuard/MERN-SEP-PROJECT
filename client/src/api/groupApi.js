import axiosInstance from './axiosInstance';

const groupApi = {
  getGroups: async () => {
    const res = await axiosInstance.get('/groups');
    return res.data;
  },
  createGroup: async (payload) => {
    const res = await axiosInstance.post('/groups', payload);
    return res.data;
  },
  updateGroup: async (id, payload) => {
    const res = await axiosInstance.patch(`/groups/${id}`, payload);
    return res.data;
  },
  deleteGroup: async (id) => {
    const res = await axiosInstance.delete(`/groups/${id}`);
    return res.data;
  },
};

export default groupApi;