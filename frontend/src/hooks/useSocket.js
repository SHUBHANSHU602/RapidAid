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
    if (!sessionId) return undefined;
    const socket = getSocket();
    const join = () => socket.emit('join_session', { sessionId });

    if (socket.connected) join();
    socket.on('connect', join);

    return () => socket.off('connect', join);
  }, [sessionId]);
}

export function useJoinAsDriver(sessionId) {
  useEffect(() => {
    if (!sessionId) return undefined;
    const socket = getSocket();
    const join = () => socket.emit('join_as_driver', { sessionId });

    if (socket.connected) join();
    socket.on('connect', join);

    return () => socket.off('connect', join);
  }, [sessionId]);
}
