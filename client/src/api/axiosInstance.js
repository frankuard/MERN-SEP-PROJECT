import axios from 'axios';

// Dynamic by default: whatever host/IP the browser used to load this page
// is the same machine running the backend, so we just reuse it — no more
// hardcoding a specific IP that breaks the moment the network changes.
// VITE_API_URL in .env still works as an explicit override if you ever
// need to point at a different backend (e.g. a deployed server), but for
// local network use you can leave it unset entirely.
const getDefaultApiUrl = () => `${window.location.protocol}//${window.location.hostname}:3000/api`;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || getDefaultApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default axiosInstance;