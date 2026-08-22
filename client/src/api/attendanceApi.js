import axiosInstance from './axiosInstance';

const attendanceApi = {
  // Student
  getMyAttendance: async () => {
    const res = await axiosInstance.get('/attendance/my');
    return res.data;
  },

  // Admin
  getAllStudents: async () => {
    const res = await axiosInstance.get('/attendance/admin/all');
    return res.data; // array of { studentId, username, email, department, semester, totalDays, present, absent, percentage }
  },
  updateStudentAttendance: async (studentId, { totalDays, present, absent }) => {
    const res = await axiosInstance.post(`/attendance/student/${studentId}`, { totalDays, present, absent });
    return res.data;
  },
};

export default attendanceApi;