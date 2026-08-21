import axiosInstance from './axiosInstance';
import { CANTEEN_MENU, CANTEEN_SPECIALS_LIST } from '../data/studentDashboardData';

/**
 * Canteen Menu & Credit Khata API Service
 */
export const canteenApi = {
  // ==========================================
  // MENU (FOOD) ENDPOINTS
  // ==========================================

  // Get full menu (with optional category / search filter)
  getMenu: async (params = {}) => {
    try {
      const queryStr = typeof params === 'string' ? `?category=${params}` : '';
      const res = await axiosInstance.get(`/canteen/menu${queryStr}`);
      return res.data;
    } catch {
      return CANTEEN_MENU;
    }
  },

  // Get single menu item by ID
  getMenuItemById: async (id) => {
    try {
      const res = await axiosInstance.get(`/canteen/menu/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Add new food item (Admin/Staff)
  createMenuItem: async (payload) => {
    try {
      const res = await axiosInstance.post('/canteen/menu', payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Update food item (Admin/Staff)
  updateMenuItem: async (id, payload) => {
    try {
      const res = await axiosInstance.put(`/canteen/menu/${id}`, payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Delete food item (Admin/Staff)
  deleteMenuItem: async (id) => {
    try {
      const res = await axiosInstance.delete(`/canteen/menu/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // ==========================================
  // CREDIT / KHATA ENDPOINTS
  // ==========================================

  // Get logged-in student's own credit balance
  getCreditBalance: async () => {
    try {
      const res = await axiosInstance.get('/canteen/credit/my-balance');
      return res.data;
    } catch {
      return { remainingBalance: 150, amountDue: 150, amountPaid: 0, paymentStatus: 'Pending' };
    }
  },

  // Get all student credit records (Admin/Staff)
  getAllCredits: async (params = {}) => {
    try {
      const res = await axiosInstance.get('/canteen/credit', { params });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Get credit record by ID (Admin/Staff)
  getCreditById: async (id) => {
    try {
      const res = await axiosInstance.get(`/canteen/credit/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Create or add credit due for student (Admin/Staff)
  createOrUpdateCredit: async (payload) => {
    try {
      const res = await axiosInstance.post('/canteen/credit', payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Record payment to clear credit (Admin/Staff)
  recordCreditPayment: async (id, paymentPayload) => {
    try {
      const res = await axiosInstance.post(`/canteen/credit/${id}/pay`, paymentPayload);
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Delete credit account (Admin/Staff)
  deleteCreditRecord: async (id) => {
    try {
      const res = await axiosInstance.delete(`/canteen/credit/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  },
};

export default canteenApi;
