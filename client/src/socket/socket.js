import { io } from 'socket.io-client';

// Same reasoning as axiosInstance.js — derive the backend host from
// whatever address the browser is currently using, instead of a
// hardcoded IP. VITE_SOCKET_URL still overrides if set.
const getDefaultSocketUrl = () => `${window.location.protocol}//${window.location.hostname}:3000`;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || getDefaultSocketUrl();

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      // Auth here is cookie-based (httpOnly JWT cookie set by the server on
      // login), not a token we can read in JS — withCredentials makes the
      // browser attach that cookie automatically on the socket handshake,
      // same as axiosInstance already does for regular API calls.
      withCredentials: true,
    });
  }
  return socket;
};

// No token parameter — there's nothing for the frontend to pass. The
// server authenticates the connection itself by reading the cookie off
// the handshake (see server/socket/socketHandler.js).
export const connectSocket = () => {
  const activeSocket = getSocket();
  if (activeSocket.connected) return activeSocket;

  activeSocket.connect();
  return activeSocket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export default getSocket;