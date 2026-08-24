import axiosInstance from "./axiosInstance";

const classroomApi = {
  // Student
  getVacantClassrooms: async (day) => {
    const res = await axiosInstance.get("/classrooms", {
      params: day ? { day } : {},
    });

    return res.data;
  },

  requestClassroom: async (payload) => {
    const res = await axiosInstance.post(
      "/classrooms/requests",
      payload
    );

    return res.data;
  },

  getMyRequests: async () => {
    const res = await axiosInstance.get(
      "/classrooms/my-requests"
    );

    return res.data;
  },

  // Admin - classrooms
  getAllVacantClassrooms: async () => {
    const res = await axiosInstance.get(
      "/classrooms/admin"
    );

    return res.data;
  },

  createVacantClassroom: async (payload) => {
    const res = await axiosInstance.post(
      "/classrooms",
      payload
    );

    return res.data;
  },

  updateVacantClassroom: async (id, payload) => {
    const res = await axiosInstance.patch(
      `/classrooms/${id}`,
      payload
    );

    return res.data;
  },

  deleteVacantClassroom: async (id) => {
    const res = await axiosInstance.delete(
      `/classrooms/${id}`
    );

    return res.data;
  },

  // Admin - requests
  getClassroomRequests: async () => {
    const res = await axiosInstance.get(
      "/classrooms/requests/admin"
    );

    return res.data;
  },

  updateRequestStatus: async (id, payload) => {
    const res = await axiosInstance.patch(
      `/classrooms/requests/${id}`,
      payload
    );

    return res.data;
  },
};

export default classroomApi;