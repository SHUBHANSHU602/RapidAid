import { useEffect } from 'react';
import useDriverStore from '../../../store/driverStore';
import { getSocket } from '../../../services/socket';

export default function LocationEmitter({ active }) {
  const { startLocationEmit, stopLocationEmit } = useDriverStore();

  useEffect(() => {
    if (active) {
      const socket = getSocket();
      startLocationEmit(socket);
    } else {
      stopLocationEmit();
    }
    return () => stopLocationEmit();
  }, [active, startLocationEmit, stopLocationEmit]);

  return null;
}
