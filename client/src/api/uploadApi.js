import axiosInstance from './axiosInstance';

const uploadApi = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await axiosInstance.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // { url }
  },
};

export default uploadApi;