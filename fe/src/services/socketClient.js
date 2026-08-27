import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8000';

let socket = null;

function getToken() {
  try {
    const authRaw = localStorage.getItem('inkwell-auth');
    const authData = authRaw ? JSON.parse(authRaw) : null;
    return authData?.token || null;
  } catch (e) {
    return null;
  }
}

export function connectSocket() {
  const token = getToken();
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}