import axiosInstance from './axiosInstance';

const vacantClassesApi = {
  // GET /api/classrooms/vacant?day=Monday
  // Returns every classroom with a computed status: 'vacant' | 'class' | 'blocked'
  getVacantClassrooms: async (day) => {
    const res = await axiosInstance.get('/classrooms/vacant', { params: { day } });
    return res.data;
  },

  // POST /api/classroom-requests   body: { classroomId, day, startTime, endTime, reason }
  requestRoom: async (payload) => {
    const res = await axiosInstance.post('/classroom-requests', payload);
    return res.data;
  },

  // GET /api/classroom-requests/mine
  getMyRequests: async () => {
    const res = await axiosInstance.get('/classroom-requests/mine');
    return res.data;
  },

  // DELETE /api/classroom-requests/:id
  cancelRequest: async (requestId) => {
    const res = await axiosInstance.delete(`/classroom-requests/${requestId}`);
    return res.data;
  },
};

export default vacantClassesApi;