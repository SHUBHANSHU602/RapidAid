import { create } from 'zustand';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';

export const useSocketStore = create((set, get) => ({
  isConnected: false,
  status: 'disconnected', // 'connected' | 'disconnected' | 'reconnecting'
  socketId: null,
  lastPing: null,

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('connect', () => {
      set({
        isConnected: true,
        status: 'connected',
        socketId: socket.id,
        lastPing: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      set({
        isConnected: false,
        status: 'disconnected',
        socketId: null,
      });
    });

    socket.on('connect_error', () => {
      set({
        isConnected: false,
        status: 'reconnecting',
      });
    });

    socket.on('reconnect', () => {
      set({
        isConnected: true,
        status: 'connected',
        socketId: socket.id,
        lastPing: Date.now(),
      });
    });

    if (socket.connected) {
      set({
        isConnected: true,
        status: 'connected',
        socketId: socket.id,
      });
    }
  },

  connect: (token) => {
    const socket = connectSocket(token);
    get().initSocketListeners();
    return socket;
  },

  disconnect: () => {
    disconnectSocket();
    set({ isConnected: false, status: 'disconnected', socketId: null });
  },
}));
