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

const adminUserApi = {
  getAllUsers: async (params = {}) => {
    try {
      const res = await axiosInstance.get('/admin/users', { params });
      return normalizeList(res.data);
    } catch (err) {
      console.error('Error fetching users from MongoDB:', err);
      throw err;
    }
  },

  getUserById: async (id) => {
    try {
      const res = await axiosInstance.get(`/admin/users/${id}`);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error fetching user #${id}:`, err);
      throw err;
    }
  },

  updateUser: async (id, payload) => {
    try {
      const res = await axiosInstance.patch(`/admin/users/${id}`, payload);
      return normalizeItem(res.data);
    } catch (err) {
      console.error(`Error updating user #${id}:`, err);
      throw err;
    }
  },
  deleteUser: async (id) => {
  try {
    const res = await axiosInstance.delete(`/admin/users/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Error deleting user #${id}:`, err);
    throw err;
  }
},
};

export default adminUserApi;