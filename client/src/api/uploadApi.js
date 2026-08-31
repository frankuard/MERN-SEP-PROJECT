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

  // Images or documents (PDF, Word, Excel, TXT, MD) — used for chat attachments.
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // { url, name }
  },
};

export default uploadApi;