import axiosInstance from './axiosInstance';

const moduleApi = {
  getModules: async () => {
    const res = await axiosInstance.get('/modules');
    return res.data;
  },
  createModule: async (payload) => {
    const res = await axiosInstance.post('/modules', payload);
    return res.data;
  },
  updateModule: async (id, payload) => {
    const res = await axiosInstance.patch(`/modules/${id}`, payload);
    return res.data;
  },
  deleteModule: async (id) => {
    const res = await axiosInstance.delete(`/modules/${id}`);
    return res.data;
  },
};

export default moduleApi;