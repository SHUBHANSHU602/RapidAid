import { useEffect } from 'react';
import { getSocket } from '../services/socket';

/**
 * Custom hook to safely subscribe to Socket.io events with automatic cleanup on unmount.
 * @param {string} eventName - Socket event name
 * @param {Function} handler - Event callback handler
 */
export const useSocket = (eventName, handler) => {
  useEffect(() => {
    if (!eventName || !handler) return;

    const socket = getSocket();
    if (!socket) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [eventName, handler]);
};

export default useSocket;
