import axiosInstance from './axiosInstance';
import { CANTEEN_MENU, CANTEEN_SPECIALS_LIST } from '../data/studentDashboardData';

/**
 * Canteen & Ordering Service & Endpoints
 */
export const canteenApi = {
  // Get full menu
  getMenu: async () => {
    try {
      const res = await axiosInstance.get('/canteen/menu');
      return res.data;
    } catch {
      return CANTEEN_MENU;
    }
  },

  // Get today's specials
  getSpecials: async () => {
    try {
      const res = await axiosInstance.get('/canteen/specials');
      return res.data;
    } catch {
      return CANTEEN_SPECIALS_LIST;
    }
  },

  // Get user credit khata balance
  getCreditBalance: async () => {
    try {
      const res = await axiosInstance.get('/canteen/credit-balance');
      return res.data;
    } catch {
      return { balance: 150 };
    }
  },

  // Place food order
  placeOrder: async (orderPayload) => {
    try {
      const res = await axiosInstance.post('/canteen/orders', orderPayload);
      return res.data;
    } catch {
      return {
        id: `ord_${Date.now()}`,
        ...orderPayload,
        tokenNumber: Math.floor(100 + Math.random() * 900),
        status: 'Confirmed',
        time: 'Just now',
      };
    }
  },

  // Settle credit due in cash with owner approval
  clearCreditCash: async (amount) => {
    try {
      const res = await axiosInstance.post('/canteen/credit-settle-cash', { amount });
      return res.data;
    } catch {
      return { success: true, newBalance: 0 };
    }
  },
};

export default canteenApi;
