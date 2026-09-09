import axiosInstance from './axiosInstance';

// Client API for the Community Portal's Manage User + Workshop Release
// features. Mirror of server/routes/communityPortal.routes.js.
const communityPortalApi = {
  // ── Community portal (member account) ───────────────────────────────────
  searchUsers: async (query) => {
    const res = await axiosInstance.get('/community-portal/users/search', {
      params: { q: query },
    });
    return res.data;
  },

  getMemberships: async (communityId) => {
    const res = await axiosInstance.get(`/community-portal/${communityId}/memberships`);
    return res.data;
  },

  sendMembershipRequest: async (communityId, userId) => {
    const res = await axiosInstance.post(`/community-portal/${communityId}/memberships`, { userId });
    return res.data;
  },

  // ── User side ───────────────────────────────────────────────────────────
  getMyRequests: async () => {
    const res = await axiosInstance.get('/community-portal/my/requests');
    return res.data;
  },

  getMyMemberships: async () => {
    const res = await axiosInstance.get('/community-portal/my/memberships');
    return res.data;
  },

  respondToMembershipRequest: async (membershipId, action) => {
    const res = await axiosInstance.patch(`/community-portal/requests/${membershipId}`, { action });
    return res.data;
  },

  // ── Real-time Total Members ──────────────────────────────────────────────
  getMemberCounts: async () => {
    const res = await axiosInstance.get('/community-portal/counts');
    return res.data;
  },

  // ── About Community profiles (single source of truth, shared with
  //    Managed Users → About Community) ────────────────────────────────────
  getCommunityProfiles: async () => {
    const res = await axiosInstance.get('/community-portal/communities');
    return res.data;
  },

  updateCommunityProfile: async (communityId, data) => {
    const res = await axiosInstance.put(`/community-portal/communities/${communityId}`, data);
    return res.data;
  },

  // ── Workshops ───────────────────────────────────────────────────────────
  getCommunityWorkshops: async (communityId) => {
    const res = await axiosInstance.get(`/community-portal/${communityId}/workshops`);
    return res.data;
  },

  createCommunityWorkshop: async (communityId, data) => {
    const res = await axiosInstance.post(`/community-portal/${communityId}/workshops`, data);
    return res.data;
  },

  deleteCommunityWorkshop: async (communityId, workshopId) => {
    const res = await axiosInstance.delete(`/community-portal/${communityId}/workshops/${workshopId}`);
    return res.data;
  },
};

export default communityPortalApi;