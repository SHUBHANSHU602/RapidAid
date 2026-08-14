import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

/**
 * Initializes and connects the singleton Socket.io client.
 * @param {string} token - JWT Access Token
 * @returns {Socket}
 */
export const connectSocket = (token) => {
  const authToken = token || localStorage.getItem('accessToken');

  if (socketInstance) {
    if (socketInstance.connected) {
      return socketInstance;
    }
    socketInstance.auth = { token: authToken };
    socketInstance.connect();
    return socketInstance;
  }

  socketInstance = io(SOCKET_SERVER_URL, {
    auth: {
      token: authToken,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] Connected with ID:', socketInstance.id);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socketInstance.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  return socketInstance;
};

/**
 * Gets the active socket instance or creates one.
 * @returns {Socket}
 */
export const getSocket = () => {
  if (!socketInstance) {
    const token = localStorage.getItem('accessToken');
    return connectSocket(token);
  }
  return socketInstance;
};

/**
 * Disconnects and destroys the socket instance.
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('[Socket] Instance destroyed');
  }
};

/**
 * Join an emergency session room as a patient.
 * @param {string} sessionId 
 */
export const joinSession = (sessionId) => {
  const socket = getSocket();
  if (socket && sessionId) {
    socket.emit('join_session', { sessionId });
  }
};

/**
 * Join an emergency session room as a driver.
 * @param {string} sessionId 
 */
export const joinAsDriver = (sessionId) => {
  const socket = getSocket();
  if (socket && sessionId) {
    socket.emit('join_as_driver', { sessionId });
  }
};

/**
 * Emit driver GPS location update.
 * @param {number} latitude 
 * @param {number} longitude 
 */
export const emitLocationUpdate = (latitude, longitude) => {
  const socket = getSocket();
  if (socket && typeof latitude === 'number' && typeof longitude === 'number') {
    socket.emit('location_update', { latitude, longitude });
  }
};
