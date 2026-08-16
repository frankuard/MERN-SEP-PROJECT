import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (token) => {
  const activeSocket = getSocket();
  if (activeSocket.connected) return activeSocket;

  activeSocket.auth = { token };
  activeSocket.connect();
  return activeSocket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export default getSocket;
