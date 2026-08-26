import axiosInstance from './axiosInstance';

const volunteerApi = {
  // -------- Student --------
  getMyVolunteerHistory: async () => {
    const res = await axiosInstance.get('/volunteer-records/mine');
    return res.data;
  },

  // -------- Admin --------
  getAllVolunteerRecordsAdmin: async (studentId) => {
    const res = await axiosInstance.get('/volunteer-records/admin', { params: studentId ? { studentId } : {} });
    return res.data;
  },
  // payload: { studentId, eventId, role, date, hours }
  createVolunteerRecord: async (payload) => {
    const res = await axiosInstance.post('/volunteer-records', payload);
    return res.data;
  },
  updateVolunteerRecord: async (id, payload) => {
    const res = await axiosInstance.patch(`/volunteer-records/${id}`, payload);
    return res.data;
  },
  deleteVolunteerRecord: async (id) => {
    const res = await axiosInstance.delete(`/volunteer-records/${id}`);
    return res.data;
  },
};

export default volunteerApi;