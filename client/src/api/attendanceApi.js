import axiosInstance from './axiosInstance';

const attendanceApi = {
  // -------- Student --------
  getMyAttendance: async () => {
    const res = await axiosInstance.get('/attendance/mine');
    return res.data;
  },
  getMyAttendanceLog: async () => {
    const res = await axiosInstance.get('/attendance/mine/log');
    return res.data;
  },
  // payload: { reason }
  createReportRequest: async (payload) => {
    const res = await axiosInstance.post('/attendance/report-requests', payload);
    return res.data;
  },
  getMyReportRequests: async () => {
    const res = await axiosInstance.get('/attendance/report-requests/mine');
    return res.data;
  },

  // -------- Admin --------
  getAllAttendanceAdmin: async (studentId) => {
    const res = await axiosInstance.get('/attendance/admin', { params: studentId ? { studentId } : {} });
    return res.data;
  },
  // Per-student totals for the Manage Attendance table.
  // Replaces the old attendanceApi.getAllStudents().
  getAttendanceSummaryAdmin: async () => {
    const res = await axiosInstance.get('/attendance/admin/summary');
    return res.data;
  },
  // payload: { totalDays, present, absent }
  // Replaces the old attendanceApi.updateStudentAttendance(studentId, payload).
  quickSetAttendance: async (studentId, payload) => {
    const res = await axiosInstance.post(`/attendance/quick-set/${studentId}`, payload);
    return res.data;
  },
  // payload: { studentId, date, time, room, status }
  markAttendance: async (payload) => {
    const res = await axiosInstance.post('/attendance', payload);
    return res.data;
  },
  updateAttendance: async (id, payload) => {
    const res = await axiosInstance.patch(`/attendance/${id}`, payload);
    return res.data;
  },
  deleteAttendance: async (id) => {
    const res = await axiosInstance.delete(`/attendance/${id}`);
    return res.data;
  },
  getAllReportRequestsAdmin: async () => {
    const res = await axiosInstance.get('/attendance/report-requests/admin');
    return res.data;
  },
  // payload: { status: 'fulfilled' | 'rejected', adminNote, reportFileUrl }
  updateReportRequest: async (id, payload) => {
    const res = await axiosInstance.patch(`/attendance/report-requests/${id}`, payload);
    return res.data;
  },
};

export default attendanceApi;