import axiosInstance from './axiosInstance';

const devcorpsApi = {
  getPortal: async () => {
    const res = await axiosInstance.get('/devcorps/portal');
    return res.data;
  },
};

export default devcorpsApi;