import axiosInstance from './axiosInstance';

const uploadApi = {
  // `folder` is optional — pass one of the ALLOWED_FOLDERS keys from the
  // backend (e.g. 'profile-photo', 'cover-photo') to route the upload into
  // that ImageKit folder. Omit it for the existing untouched behavior.
  uploadImage: async (file, folder) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    const res = await axiosInstance.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // { url }
  },

  // Images or documents (PDF, Word, Excel, TXT, MD) — used for chat attachments.
  // Routed into a per-user folder on the backend: /chat-attachments/{username}/
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'chat-attachment');
    const res = await axiosInstance.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // { url, name }
  },
};

export default uploadApi;