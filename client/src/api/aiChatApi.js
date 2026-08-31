import axiosInstance from './axiosInstance';

/**
 * Send a message to the CampusConnect AI backend.
 * @param {string} message - The user's message.
 * @param {Array<{role: string, parts: string}>} history - Prior conversation turns.
 * @returns {Promise<{reply: string}>}
 */
const sendAIMessage = async (message, history = []) => {
  const response = await axiosInstance.post('/ai/chat', { message, history });
  return response.data;
};

export default { sendAIMessage };
