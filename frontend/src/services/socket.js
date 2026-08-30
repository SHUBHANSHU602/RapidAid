import { io } from 'socket.io-client';

let socket = null;

function currentToken() {
  return localStorage.getItem('accessToken');
}

export function connectSocket() {
  const token = currentToken();

  // Reuse the same Socket instance. Creating a second instance while the first one
  // is reconnecting causes duplicate server connections and duplicate events.
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  socket.connect();
  return socket;
}

export function getSocket() {
  return connectSocket();
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
