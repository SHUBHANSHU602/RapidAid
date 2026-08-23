import { create } from 'zustand';
import api from '../services/api';

const useDriverStore = create((set, get) => ({
  assignment: null,
  isOnline: false,
  phase: 'PRE_ARRIVAL',
  watchId: null,

  setAssignment: (session) => set({ assignment: session }),
  setPhase: (phase) => set({ phase }),
  clearAssignment: () => set({ assignment: null, phase: 'PRE_ARRIVAL' }),

  toggleOnline: async (ambulanceId) => {
    const { isOnline } = get();
    const newStatus = isOnline ? 'OFFLINE' : 'AVAILABLE';
    await api.patch(`/ambulances/${ambulanceId}/status`, { status: newStatus });
    set({ isOnline: !isOnline });
  },

  startLocationEmit: (socket) => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit('location_update', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 }
    );
    set({ watchId });
  },

  stopLocationEmit: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null });
    }
  },
}));

export default useDriverStore;
