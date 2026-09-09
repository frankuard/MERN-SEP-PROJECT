import axiosInstance from './axiosInstance';

const devcorpsApi = {
  getPortal: async () => {
    const res = await axiosInstance.get('/devcorps/portal');
    return res.data;
  },

  getDocumentationSummary: async () => {
    const res = await axiosInstance.get('/devcorps/documentation/summary');
    return res.data;
  },

  getDocumentation: async (communityId) => {
    const res = await axiosInstance.get(`/devcorps/documentation/${communityId}`);
    return res.data;
  },

  addEvent: async (communityId, title) => {
    const res = await axiosInstance.post(`/devcorps/documentation/${communityId}/events`, { title });
    return res.data;
  },

  removeEvent: async (communityId, order) => {
    const res = await axiosInstance.delete(`/devcorps/documentation/${communityId}/events/${order}`);
    return res.data;
  },

  renameEvent: async (communityId, order, title) => {
    const res = await axiosInstance.patch(`/devcorps/documentation/${communityId}/events/${order}`, { title });
    return res.data;
  },

  updateTask: async (communityId, order, key, payload) => {
    const res = await axiosInstance.patch(
      `/devcorps/documentation/${communityId}/events/${order}/tasks/${key}`,
      payload
    );
    return res.data;
  },

  updateWorkshops: async (communityId, count) => {
    const res = await axiosInstance.patch(`/devcorps/documentation/${communityId}/workshops`, { count });
    return res.data;
  },

  getCommunityFiles: async (communityId) => {
    const res = await axiosInstance.get(`/devcorps/documentation/${communityId}/files`);
    return res.data;
  },

  uploadCommunityFile: async (communityId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post(
      `/devcorps/documentation/${communityId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  updateFilePoints: async (fileId, points) => {
    const res = await axiosInstance.patch(`/devcorps/documentation/files/${fileId}`, { points });
    return res.data;
  },

  deleteCommunityFile: async (fileId) => {
    const res = await axiosInstance.delete(`/devcorps/documentation/files/${fileId}`);
    return res.data;
  },
};

export default devcorpsApi;