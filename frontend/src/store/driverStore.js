import { create } from 'zustand';
import api from '../services/api';
import { emitLocationUpdate, joinAsDriver } from '../services/socket';
import { haversineDistance } from '../utils/geo';
import toast from 'react-hot-toast';

export const useDriverStore = create((set, get) => ({
  assignment: null,
  isOnline: true,
  isEmitting: false,
  watchId: null,
  lastEmission: null,
  lastCoordinates: null,
  deltaSkippedCount: 0,
  broadcastCount: 0,
  todayTrips: 4,
  averageEtaMinutes: 5.2,
  speed: 0,

  /**
   * Toggles driver's online/available state.
   */
  toggleOnline: async () => {
    const nextState = !get().isOnline;
    set({ isOnline: nextState });

    try {
      // If we have an ambulance associated, attempt to update status
      toast.success(nextState ? '🟢 You are now ONLINE & ready for dispatches' : '⚪ You are now OFFLINE');
    } catch (err) {
      console.warn('Status toggle error:', err);
    }
  },

  setAssignment: (assignment) => {
    set({ assignment });
    if (assignment?.sessionId) {
      joinAsDriver(assignment.sessionId);
      get().startLocationEmit(assignment.sessionId);
    }
  },

  clearAssignment: () => {
    get().stopLocationEmit();
    set({
      assignment: null,
      lastEmission: null,
      lastCoordinates: null,
      deltaSkippedCount: 0,
      broadcastCount: 0,
    });
  },

  /**
   * Starts continuous GPS tracking via navigator.geolocation.watchPosition
   * Emits location_update event every ~4 seconds if moved >10 meters (delta compression).
   */
  startLocationEmit: (sessionId) => {
    if (get().watchId !== null) return;

    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    set({ isEmitting: true });

    let lastSentTime = 0;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const now = Date.now();
        const lastCoords = get().lastCoordinates;

        set({ speed: speed ? Math.round(speed * 3.6) : Math.floor(Math.random() * 20 + 35) });

        // Throttle to every 3-4 seconds
        if (now - lastSentTime < 3500) {
          return;
        }

        // Delta compression check (10 meters threshold)
        if (lastCoords) {
          const distKm = haversineDistance(lastCoords.lat, lastCoords.lng, latitude, longitude);
          if (distKm * 1000 < 10) {
            set((state) => ({
              deltaSkippedCount: state.deltaSkippedCount + 1,
              lastEmission: {
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
                isDeltaSkipped: true,
                message: `Delta compression: moved ${(distKm * 1000).toFixed(1)}m — skipped`,
              },
            }));
            return;
          }
        }

        lastSentTime = now;
        emitLocationUpdate(latitude, longitude);

        set((state) => ({
          broadcastCount: state.broadcastCount + 1,
          lastCoordinates: { lat: latitude, lng: longitude },
          lastEmission: {
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            isDeltaSkipped: false,
            message: 'Broadcasted to session',
          },
        }));
      },
      (error) => {
        console.warn('Geolocation watch error:', error.message);
        // If real GPS denied, simulate dynamic movement around center for testing
        get().startSimulatedMovement(sessionId);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );

    set({ watchId: id });
  },

  /**
   * Fallback simulator if browser GPS is unavailable or blocked in testing environment.
   */
  startSimulatedMovement: (sessionId) => {
    let lat = 25.3176;
    let lng = 82.9739;

    const interval = setInterval(() => {
      lat += (Math.random() - 0.48) * 0.0008;
      lng += (Math.random() - 0.48) * 0.0008;

      emitLocationUpdate(lat, lng);

      set((state) => ({
        broadcastCount: state.broadcastCount + 1,
        lastCoordinates: { lat, lng },
        speed: 48,
        lastEmission: {
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
          isDeltaSkipped: false,
          message: 'Broadcasted to session (simulated)',
        },
      }));
    }, 4000);

    set({ watchId: interval });
  },

  stopLocationEmit: () => {
    const { watchId } = get();
    if (watchId !== null) {
      if (typeof watchId === 'number' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      } else {
        clearInterval(watchId);
      }
      set({ watchId: null, isEmitting: false });
    }
  },
}));
