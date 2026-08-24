import axiosInstance from './axiosInstance';

const resourcesApi = {
  // -------- Student — Books --------
  getBooks: async () => {
    const res = await axiosInstance.get('/resources/books');
    return res.data;
  },
  getMyBorrows: async () => {
    const res = await axiosInstance.get('/resources/my-borrows');
    return res.data;
  },
  requestBorrow: async (bookId, payload) => {
    const res = await axiosInstance.post(`/resources/books/${bookId}/borrow`, payload);
    return res.data;
  },

  // -------- Admin — Books --------
  getBooksAdmin: async () => {
    const res = await axiosInstance.get('/resources/books/admin');
    return res.data;
  },
  createBook: async (payload) => {
    const res = await axiosInstance.post('/resources/books', payload);
    return res.data;
  },
  updateBook: async (id, payload) => {
    const res = await axiosInstance.patch(`/resources/books/${id}`, payload);
    return res.data;
  },
  deleteBook: async (id) => {
    const res = await axiosInstance.delete(`/resources/books/${id}`);
    return res.data;
  },

  // -------- Admin — Book Borrow Requests --------
  getBorrowRequests: async (params = {}) => {
    const res = await axiosInstance.get('/resources/borrow-requests', { params });
    return res.data;
  },
  approveBorrowRequest: async (id) => {
    const res = await axiosInstance.patch(`/resources/borrow-requests/${id}/approve`);
    return res.data;
  },
  rejectBorrowRequest: async (id) => {
    const res = await axiosInstance.patch(`/resources/borrow-requests/${id}/reject`);
    return res.data;
  },
  markReturned: async (id) => {
    const res = await axiosInstance.patch(`/resources/borrow-requests/${id}/return`);
    return res.data;
  },

  // -------- Student — Sports --------
  getSportsItems: async () => {
    const res = await axiosInstance.get('/resources/sports-items');
    return res.data;
  },
  getMySportsRequests: async () => {
    const res = await axiosInstance.get('/resources/my-sports-requests');
    return res.data;
  },
  requestSportsItem: async (itemId, payload) => {
    const res = await axiosInstance.post(`/resources/sports-items/${itemId}/request`, payload);
    return res.data;
  },

  // -------- Admin — Sports Items --------
  createSportsItem: async (payload) => {
    const res = await axiosInstance.post('/resources/sports-items', payload);
    return res.data;
  },
  updateSportsItem: async (id, payload) => {
    const res = await axiosInstance.patch(`/resources/sports-items/${id}`, payload);
    return res.data;
  },
  deleteSportsItem: async (id) => {
    const res = await axiosInstance.delete(`/resources/sports-items/${id}`);
    return res.data;
  },

  // -------- Admin — Sports Requests --------
  getSportsRequests: async (params = {}) => {
    const res = await axiosInstance.get('/resources/sports-requests', { params });
    return res.data;
  },
  approveSportsRequest: async (id) => {
    const res = await axiosInstance.patch(`/resources/sports-requests/${id}/approve`);
    return res.data;
  },
  rejectSportsRequest: async (id) => {
    const res = await axiosInstance.patch(`/resources/sports-requests/${id}/reject`);
    return res.data;
  },
  markSportsReturned: async (id) => {
    const res = await axiosInstance.patch(`/resources/sports-requests/${id}/return`);
    return res.data;
  },
};

export default resourcesApi;