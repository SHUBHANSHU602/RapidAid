import { io } from 'socket.io-client';

let socket = null;

function currentToken() {
  return localStorage.getItem('accessToken');
}

export function connectSocket() {
  const token = currentToken();

  // Reuse one Socket instance so reconnects do not create duplicate connections/events.
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

export function updateSocketToken(accessToken) {
  if (!socket) return;

  socket.auth = { token: accessToken };

  // Socket auth is verified during the handshake, so reconnect with the new JWT.
  // useJoinSession/useJoinAsDriver rejoin their rooms on the next `connect` event.
  if (socket.connected) {
    socket.disconnect();
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
