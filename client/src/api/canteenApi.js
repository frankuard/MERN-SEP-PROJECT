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

  // Orders
  placeOrder: async (payload) => {
    const res = await axiosInstance.post('/canteen/orders', payload);
    return res.data;
  },
  getMyOrders: async () => {
    const res = await axiosInstance.get('/canteen/orders/my');
    return res.data;
  },
  getAllOrders: async (params = {}) => {
    const res = await axiosInstance.get('/canteen/orders', { params });
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await axiosInstance.get(`/canteen/orders/${id}`);
    return res.data;
  },
  updateOrderStatus: async (id, payload) => {
    const res = await axiosInstance.put(`/canteen/orders/${id}/status`, payload);
    return res.data;
  },
  confirmCounterPayment: async (id) => {
    const res = await axiosInstance.post(`/canteen/orders/${id}/confirm-payment`);
    return res.data;
  },

  // Credit Requests
  getMyCreditRequests: async () => {
    const res = await axiosInstance.get('/canteen/credit-requests/my');
    return res.data;
  },
  getAllCreditRequests: async (params = {}) => {
    const res = await axiosInstance.get('/canteen/credit-requests', { params });
    return res.data;
  },
  reviewCreditRequest: async (id, payload) => {
    const res = await axiosInstance.put(`/canteen/credit-requests/${id}`, payload);
    return res.data;
  },
};

export default canteenApi;