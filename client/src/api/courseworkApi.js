import axiosInstance from './axiosInstance';

const courseworkApi = {
  // -------- Teacher Endpoints --------
  getTeacherAssignedClasses: async () => {
    const res = await axiosInstance.get('/coursework/teacher/assigned');
    return res.data;
  },

  getTeacherCoursework: async () => {
    const res = await axiosInstance.get('/coursework/teacher');
    return res.data;
  },

  createCoursework: async (payload) => {
    const res = await axiosInstance.post('/coursework', payload);
    return res.data;
  },

  updateCoursework: async (id, payload) => {
    const res = await axiosInstance.patch(`/coursework/${id}`, payload);
    return res.data;
  },

  deleteCoursework: async (id) => {
    const res = await axiosInstance.delete(`/coursework/${id}`);
    return res.data;
  },

  getSubmissions: async (courseworkId) => {
    const res = await axiosInstance.get(`/coursework/${courseworkId}/submissions`);
    return res.data;
  },

  gradeSubmission: async (submissionId, payload) => {
    const res = await axiosInstance.patch(`/coursework/submissions/${submissionId}/grade`, payload);
    return res.data;
  },

  // -------- Student Endpoints --------
  getStudentCoursework: async () => {
    const res = await axiosInstance.get('/coursework');
    return res.data;
  },

  submitCoursework: async (courseworkId, payload) => {
    const res = await axiosInstance.post(`/coursework/${courseworkId}/submit`, payload);
    return res.data;
  },
};

export default courseworkApi;
