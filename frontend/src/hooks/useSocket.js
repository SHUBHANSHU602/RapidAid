import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

export function useSocketEvent(event, handler, deps = []) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const fn = (...args) => handlerRef.current(...args);
    socket.on(event, fn);
    return () => socket.off(event, fn);
  }, deps);
}

export function useJoinSession(sessionId) {
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    socket.emit('join_session', { sessionId });
  }, [sessionId]);
}

export function useJoinAsDriver(sessionId) {
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    socket.emit('join_as_driver', { sessionId });
  }, [sessionId]);
}
