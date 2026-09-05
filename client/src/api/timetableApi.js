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
  getUpcomingExams: async () => {
    try {
      const res = await axiosInstance.get('/timetable/exams');
      return res.data;
    } catch {
      // Route may not exist yet — caller falls back to static data
      return [];
    }
  },

  // -------- Admin — Exams --------
  getExamsAdmin: async () => {
    const res = await axiosInstance.get('/timetable/exams/admin');
    return res.data;
  },
  createExam: async (payload) => {
    const res = await axiosInstance.post('/timetable/exams', payload);
    return res.data;
  },
  updateExam: async (id, payload) => {
    const res = await axiosInstance.patch(`/timetable/exams/${id}`, payload);
    return res.data;
  },
  deleteExam: async (id) => {
    const res = await axiosInstance.delete(`/timetable/exams/${id}`);
    return res.data;
  },

  // -------- Admin — Periods --------
  getTimetableAdmin: async () => {
    const res = await axiosInstance.get('/timetable/admin');
    return res.data;
  },
  // payload: { day, startTime, endTime, classType, moduleId, lecturer, groupId, roomId, order }
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
  // payload: { periodId, newDay, newStartTime, newEndTime, newRoom, reason, effectiveDate, publishedBy, status, badgeColor }
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