import axiosInstance from './axiosInstance';

const classroomRequestApi = {
  // -------- Student --------
  // payload: { classroomId, day, startTime, endTime, reason }
  createRequest: async (payload) => {
    const res = await axiosInstance.post('/classroom-requests', payload);
    return res.data;
  },
  getMyRequests: async () => {
    const res = await axiosInstance.get('/classroom-requests/mine');
    return res.data;
  },
  cancelMyRequest: async (id) => {
    const res = await axiosInstance.delete(`/classroom-requests/${id}`);
    return res.data;
  },

  // -------- Admin --------
  getAllRequests: async () => {
    const res = await axiosInstance.get('/classroom-requests/admin');
    return res.data;
  },
  // payload: { status: 'approved' | 'rejected', reviewNote }
  reviewRequest: async (id, payload) => {
    const res = await axiosInstance.patch(`/classroom-requests/${id}/review`, payload);
    return res.data;
  },
};

export default classroomRequestApi;