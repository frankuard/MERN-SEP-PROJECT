import axiosInstance from './axiosInstance';

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

export const lostFoundApi = {
  getItems: async (params = {}) => {
    try {
      const res = await axiosInstance.get('/lost-found', { params });
      return normalizeList(res.data);
    } catch (err) {
      console.error('Error fetching lost & found items from MongoDB:', err);
      throw err;
    }
  },

  getItemById: async (id) => {
    try {
      const res = await axiosInstance.get(`/lost-found/${id}`);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error fetching lost & found item #${id}:`, err);
      throw err;
    }
  },

  reportItem: async (itemData) => {
    try {
      const res = await axiosInstance.post('/lost-found', itemData);
      return normalizeItem(res.data);
    } catch (err) {
      console.error('Error reporting lost item to MongoDB:', err);
      throw err;
    }
  },

  updateItem: async (id, updateData) => {
    try {
      const res = await axiosInstance.patch(`/lost-found/${id}`, updateData);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error updating lost & found item #${id}:`, err);
      throw err;
    }
  },

  deleteItem: async (id) => {
    try {
      const res = await axiosInstance.delete(`/lost-found/${id}`);
      return res.data;
    } catch (err) {
      console.error(`Error deleting lost & found item #${id}:`, err);
      throw err;
    }
  },

  claimItem: async (itemId, claimDetails = {}) => {
    try {
      const res = await axiosInstance.post(`/lost-found/${itemId}/claim`, claimDetails);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error claiming item #${itemId} in MongoDB:`, err);
      throw err;
    }
  },

  returnItem: async (itemId) => {
    try {
      const res = await axiosInstance.patch(`/lost-found/${itemId}/return`);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error returning item #${itemId} in MongoDB:`, err);
      throw err;
    }
  },

  getMyCctvRequests: async () => {
    try {
      const res = await axiosInstance.get('/lost-found/cctv-requests');
      return normalizeList(res.data);
    } catch (err) {
      console.error('Error fetching CCTV requests from MongoDB:', err);
      throw err;
    }
  },

  submitCctvRequest: async (cctvData) => {
    try {
      const res = await axiosInstance.post('/lost-found/cctv-request', cctvData);
      return normalizeItem(res.data);
    } catch (err) {
      console.error('Error submitting CCTV request to MongoDB:', err);
      throw err;
    }
  },

  updateCctvStatus: async (id, statusData) => {
    try {
      const res = await axiosInstance.patch(`/lost-found/cctv-request/${id}/status`, statusData);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error updating CCTV request #${id} status:`, err);
      throw err;
    }
  },

  getStats: async () => {
    try {
      const res = await axiosInstance.get('/lost-found/stats');
      return res.data;
    } catch (err) {
      console.error('Error fetching Lost & Found stats from MongoDB:', err);
      throw err;
    }
  },

  updateClaimStatus: async (itemId, claimId, status) => {
    try {
      const res = await axiosInstance.patch(`/lost-found/${itemId}/claim/${claimId}/status`, { status });
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error updating claim #${claimId} status:`, err);
      throw err;
    }
  },
};

export default lostFoundApi;