import axiosInstance from './axiosInstance';

const volunteerOpportunityApi = {
  // -------- Student --------
  getOpportunities: async () => {
    const res = await axiosInstance.get('/volunteer-opportunities');
    return res.data;
  },
  // apply: true to apply, false to withdraw
  applyToOpportunity: async (opportunityId, apply) => {
    const res = await axiosInstance.post(`/volunteer-opportunities/${opportunityId}/apply`, { apply });
    return res.data;
  },

  // -------- Admin --------
  getAllOpportunitiesAdmin: async () => {
    const res = await axiosInstance.get('/volunteer-opportunities/admin/all');
    return res.data;
  },
  getOpportunityApplicants: async (opportunityId) => {
    const res = await axiosInstance.get(`/volunteer-opportunities/${opportunityId}/applicants`);
    return res.data;
  },
  createOpportunity: async (payload) => {
    const res = await axiosInstance.post('/volunteer-opportunities', payload);
    return res.data;
  },
  updateOpportunity: async (id, payload) => {
    const res = await axiosInstance.patch(`/volunteer-opportunities/${id}`, payload);
    return res.data;
  },
  deleteOpportunity: async (id) => {
    const res = await axiosInstance.delete(`/volunteer-opportunities/${id}`);
    return res.data;
  },
};

export default volunteerOpportunityApi;