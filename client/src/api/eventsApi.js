import axiosInstance from './axiosInstance';


const eventsApi = {
  getEvents: async (params = {}) => {
    const res = await axiosInstance.get('/events', { params });
    return res.data;
  },

  getEvent: async (eventId) => {
    const res = await axiosInstance.get(`/events/${eventId}`);
    return res.data;
  },

  registerEvent: async (eventId) => {
    const res = await axiosInstance.post(`/events/${eventId}/register`);
    return res.data;
  },

  cancelRegistration: async (eventId) => {
    const res = await axiosInstance.delete(`/events/${eventId}/register`);
    return res.data;
  },

  getMyRegistrations: async () => {
    const res = await axiosInstance.get('/events/my-registrations');
    return res.data;
  },

  createEvent: async (eventData) => {
    const res = await axiosInstance.post('/events', eventData);
    return res.data;
  },

  updateEvent: async (eventId, eventData) => {
    const res = await axiosInstance.patch(`/events/${eventId}`, eventData);
    return res.data;
  },

  deleteEvent: async (eventId) => {
    const res = await axiosInstance.delete(`/events/${eventId}`);
    return res.data;
  },

  publishEvent: async (eventId) => {
    const res = await axiosInstance.post(`/events/${eventId}/publish`);
    return res.data;
  },

  unpublishEvent: async (eventId) => {
    const res = await axiosInstance.post(`/events/${eventId}/unpublish`);
    return res.data;
  },

  getEventRegistrations: async (eventId) => {
    const res = await axiosInstance.get(`/events/${eventId}/registrations`);
    return res.data;
  },
  
  getAllEventsAdmin: async () => {
  const res = await axiosInstance.get('/events/admin/all');
  return res.data;
},
};



export default eventsApi;