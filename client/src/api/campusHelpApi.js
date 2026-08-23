import axiosInstance from './axiosInstance';

export const campusHelpApi = {
  // Peer Help Requests
  getHelpRequests: async () => {
    const res = await axiosInstance.get('/campus-help/requests');
    return res.data;
  },

  submitHelpRequest: async ({ request, attachments = [] }) => {
    const res = await axiosInstance.post('/campus-help/requests', { request, attachments });
    return res.data;
  },

  addResponse: async (requestId, { message, attachments = [] }) => {
    const res = await axiosInstance.post(`/campus-help/requests/${requestId}/responses`, {
      message,
      attachments,
    });
    return res.data;
  },

  deleteHelpRequest: async (requestId) => {
    const res = await axiosInstance.delete(`/campus-help/requests/${requestId}`);
    return res.data;
  },

  // Department Contact Cards
  getDepartments: async () => {
    const res = await axiosInstance.get('/campus-help/departments');
    return res.data;
  },

  createDepartment: async (data) => {
    const res = await axiosInstance.post('/campus-help/departments', data);
    return res.data;
  },

  updateDepartment: async (id, data) => {
    const res = await axiosInstance.patch(`/campus-help/departments/${id}`, data);
    return res.data;
  },

  deleteDepartment: async (id) => {
    const res = await axiosInstance.delete(`/campus-help/departments/${id}`);
    return res.data;
  },
};

export default campusHelpApi;