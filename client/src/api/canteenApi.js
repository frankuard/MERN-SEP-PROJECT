import axiosInstance from './axiosInstance';

const canteenApi = {
  getMenu: async (params = {}) => {
    const res = await axiosInstance.get('/canteen/menu', { params });
    return res.data;
  },
  getCreditBalance: async () => {
    const res = await axiosInstance.get('/canteen/credit/my-balance');
    return res.data;
  },

  // Admin — menu
  createMenuItem: async (payload) => {
    const res = await axiosInstance.post('/canteen/menu', payload);
    return res.data;
  },
  updateMenuItem: async (id, payload) => {
    const res = await axiosInstance.put(`/canteen/menu/${id}`, payload);
    return res.data;
  },
  deleteMenuItem: async (id) => {
    const res = await axiosInstance.delete(`/canteen/menu/${id}`);
    return res.data;
  },

  // Admin — credit
  getAllCredits: async (params = {}) => {
    const res = await axiosInstance.get('/canteen/credit', { params });
    return res.data;
  },
  createOrUpdateCredit: async (payload) => {
    const res = await axiosInstance.post('/canteen/credit', payload);
    return res.data;
  },
  recordCreditPayment: async (id, payload) => {
    const res = await axiosInstance.post(`/canteen/credit/${id}/pay`, payload);
    return res.data;
  },
  deleteCreditRecord: async (id) => {
    const res = await axiosInstance.delete(`/canteen/credit/${id}`);
    return res.data;
  },
    getCreditById: async (id) => {
    const res = await axiosInstance.get(`/canteen/credit/${id}`);
    return res.data;
  },
};

export default canteenApi;