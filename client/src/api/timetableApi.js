import axiosInstance from './axiosInstance';

const timetableApi = {
  // -------- Student --------
  getTimetable: async () => {
    const res = await axiosInstance.get('/timetable');
    return res.data;
  },
  getScheduleChanges: async () => {
    const res = await axiosInstance.get('/timetable/changes');
    return res.data;
  },

  // -------- Admin — Periods --------
  getTimetableAdmin: async () => {
    const res = await axiosInstance.get('/timetable/admin');
    return res.data;
  },
  createPeriod: async (payload) => {
    const res = await axiosInstance.post('/timetable', payload);
    return res.data;
  },
  updatePeriod: async (id, payload) => {
    const res = await axiosInstance.patch(`/timetable/${id}`, payload);
    return res.data;
  },
  deletePeriod: async (id) => {
    const res = await axiosInstance.delete(`/timetable/${id}`);
    return res.data;
  },

  // -------- Admin — Schedule Changes --------
  getScheduleChangesAdmin: async () => {
    const res = await axiosInstance.get('/timetable/changes/admin');
    return res.data;
  },
  createScheduleChange: async (payload) => {
    const res = await axiosInstance.post('/timetable/changes', payload);
    return res.data;
  },
  updateScheduleChange: async (id, payload) => {
    const res = await axiosInstance.patch(`/timetable/changes/${id}`, payload);
    return res.data;
  },
  deleteScheduleChange: async (id) => {
    const res = await axiosInstance.delete(`/timetable/changes/${id}`);
    return res.data;
  },
};

export default timetableApi;