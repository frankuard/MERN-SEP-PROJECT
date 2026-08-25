import axiosInstance from './axiosInstance';

const classroomApi = {
  getClassrooms: async () => {
    const res = await axiosInstance.get('/classrooms');
    return res.data;
  },
  getVacantClassrooms: async (day) => {
    const res = await axiosInstance.get('/classrooms/vacant', { params: { day } });
    return res.data;
  },
  createClassroom: async (payload) => {
    const res = await axiosInstance.post('/classrooms', payload);
    return res.data;
  },
  updateClassroom: async (id, payload) => {
    const res = await axiosInstance.patch(`/classrooms/${id}`, payload);
    return res.data;
  },
  deleteClassroom: async (id) => {
    const res = await axiosInstance.delete(`/classrooms/${id}`);
    return res.data;
  },
  addManualBlock: async (classroomId, payload) => {
    const res = await axiosInstance.post(`/classrooms/${classroomId}/block`, payload);
    return res.data;
  },
  removeManualBlock: async (classroomId, blockId) => {
    const res = await axiosInstance.delete(`/classrooms/${classroomId}/block/${blockId}`);
    return res.data;
  },
};

export default classroomApi;