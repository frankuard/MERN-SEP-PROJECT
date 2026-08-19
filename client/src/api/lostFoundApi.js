import axiosInstance from './axiosInstance';

// Helper to normalize MongoDB items (_id -> id)
const normalizeItem = (item) => {
  if (!item) return item;
  return {
    ...item,
    id: item._id ? item._id.toString() : item.id,
  };
};

const normalizeList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeItem);
};

/**
 * Lost & Found Service & MongoDB Endpoints
 */
export const lostFoundApi = {
  // 1. Get all lost & found items from MongoDB (supports search, category, status)
  getItems: async (params = {}) => {
    try {
      const res = await axiosInstance.get('/lost-found', { params });
      return normalizeList(res.data);
    } catch (err) {
      console.error('Error fetching lost & found items from MongoDB:', err);
      throw err;
    }
  },

  // 2. Get single item by ID
  getItemById: async (id) => {
    try {
      const res = await axiosInstance.get(`/lost-found/${id}`);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error fetching lost & found item #${id}:`, err);
      throw err;
    }
  },

  // 3. Report a lost/found item to MongoDB
  reportItem: async (itemData) => {
    try {
      const res = await axiosInstance.post('/lost-found', itemData);
      return normalizeItem(res.data);
    } catch (err) {
      console.error('Error reporting lost item to MongoDB:', err);
      throw err;
    }
  },

  // 4. Update an existing item in MongoDB
  updateItem: async (id, updateData) => {
    try {
      const res = await axiosInstance.patch(`/lost-found/${id}`, updateData);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error updating lost & found item #${id}:`, err);
      throw err;
    }
  },

  // 5. Delete an item from MongoDB
  deleteItem: async (id) => {
    try {
      const res = await axiosInstance.delete(`/lost-found/${id}`);
      return res.data;
    } catch (err) {
      console.error(`Error deleting lost & found item #${id}:`, err);
      throw err;
    }
  },

  // 6. Mark item as Claimed in MongoDB
  claimItem: async (itemId, claimDetails = {}) => {
    try {
      const res = await axiosInstance.post(`/lost-found/${itemId}/claim`, claimDetails);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error claiming item #${itemId} in MongoDB:`, err);
      throw err;
    }
  },

  // 7. Mark item as Returned in MongoDB
  returnItem: async (itemId) => {
    try {
      const res = await axiosInstance.patch(`/lost-found/${itemId}/return`);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error returning item #${itemId} in MongoDB:`, err);
      throw err;
    }
  },

  // 8. Get CCTV footage verification requests for logged-in user from MongoDB
  getMyCctvRequests: async () => {
    try {
      const res = await axiosInstance.get('/lost-found/cctv-requests');
      return normalizeList(res.data);
    } catch (err) {
      console.error('Error fetching CCTV requests from MongoDB:', err);
      throw err;
    }
  },

  // 9. Submit CCTV footage request to MongoDB
  submitCctvRequest: async (cctvData) => {
    try {
      const res = await axiosInstance.post('/lost-found/cctv-request', cctvData);
      return normalizeItem(res.data);
    } catch (err) {
      console.error('Error submitting CCTV request to MongoDB:', err);
      throw err;
    }
  },

  // 10. Update CCTV request status (Staff/Admin)
  updateCctvStatus: async (id, statusData) => {
    try {
      const res = await axiosInstance.patch(`/lost-found/cctv-request/${id}/status`, statusData);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error updating CCTV request #${id} status:`, err);
      throw err;
    }
  },

  // 11. Get real-time stats from MongoDB
  getStats: async () => {
    try {
      const res = await axiosInstance.get('/lost-found/stats');
      return res.data;
    } catch (err) {
      console.error('Error fetching Lost & Found stats from MongoDB:', err);
      throw err;
    }
  },
};

export default lostFoundApi;
