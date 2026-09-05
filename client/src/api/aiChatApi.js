import axiosInstance from './axiosInstance';

/**
 * Send a message to the Chauttari AI backend.
 * Returns { reply, card? } — `card` is present for actionable flows
 * (confirmations with rows, or claim match choices).
 * @param {string} message
 * @param {Array<{role: string, parts: string}>} history
 */
const sendAIMessage = async (message, history = []) => {
  const response = await axiosInstance.post('/ai/chat', { message, history });
  return response.data;
};

/** Submit the currently pending AI flow (card confirm button). */
const confirmAction = async () => {
  const response = await axiosInstance.post('/ai/confirm');
  return response.data;
};

/** Cancel / abort the currently pending AI flow. */
const cancelAction = async () => {
  const response = await axiosInstance.post('/ai/cancel');
  return response.data;
};

/** Pick a claim match by index (claim choice card button). */
const chooseMatch = async (index) => {
  const response = await axiosInstance.post('/ai/choose', { index });
  return response.data;
};

/** Transcribe a recorded voice note via Groq whisper. */
const transcribeAudio = async (audioBlob, filename = 'voice.webm') => {
  const formData = new FormData();
  formData.append('audio', audioBlob, filename);
  const response = await axiosInstance.post('/ai/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // { text }
};

export default { sendAIMessage, confirmAction, cancelAction, chooseMatch, transcribeAudio };