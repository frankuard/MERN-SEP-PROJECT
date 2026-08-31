import axiosInstance from './axiosInstance';

const friendApi = {
  // POST /api/friends/request   body: { userId }
  sendFriendRequest: async (userId) => {
    const res = await axiosInstance.post('/friends/request', { userId });
    return res.data;
  },

  // PATCH /api/friends/request/:id   body: { status: 'accepted' | 'rejected' }
  respondToFriendRequest: async (requestId, status) => {
    const res = await axiosInstance.patch(`/friends/request/${requestId}`, { status });
    return res.data;
  },

  // GET /api/friends/requests
  // Expected shape: { incoming: [...], outgoing: [...] } — adjust the
  // consuming code if the real controller returns a flat array instead.
  getFriendRequests: async () => {
    const res = await axiosInstance.get('/friends/requests');
    return res.data;
  },

  // GET /api/friends
  getFriends: async () => {
    const res = await axiosInstance.get('/friends');
    return res.data;
  },
};

export default friendApi;