import axiosInstance from './axiosInstance';

const attendanceApi = {
  // Student
  markToday: async (room) => {
    const res = await axiosInstance.post('/attendance/mark', room ? { room } : {});
    return res.data;
  },
  getMyAttendance: async () => {
    const res = await axiosInstance.get('/attendance/my');
    return res.data; // { records, stats }
  },

  // Admin
  getSummary: async () => {
    const res = await axiosInstance.get('/attendance/summary');
    return res.data; // array of per-student summaries
  },
  getStudentDetail: async (userId) => {
    const res = await axiosInstance.get(`/attendance/student/${userId}`);
    return res.data; // { student, records, stats }
  },
  upsertStudentAttendance: async (userId, { date, status, room }) => {
    const res = await axiosInstance.post(`/attendance/student/${userId}`, { date, status, room });
    return res.data;
  },
  deleteRecord: async (recordId) => {
    const res = await axiosInstance.delete(`/attendance/${recordId}`);
    return res.data;
  },
};

export default attendanceApi;