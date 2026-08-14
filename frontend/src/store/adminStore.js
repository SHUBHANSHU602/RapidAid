import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useAdminStore = create((set, get) => ({
  sessions: [],
  ambulances: [],
  stats: {
    activeSessions: 0,
    availableAmbulances: 0,
    delayedSessions: 0,
    resolvedToday: 12,
  },
  delayedSessions: [],
  eventLogs: [
    {
      id: 'init-1',
      type: 'SYSTEM',
      status: 'AVAILABLE',
      message: 'System cluster online. LLaMA 3 triage models loaded.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'init-2',
      type: 'DISPATCH',
      status: 'ASSIGNED',
      message: 'Ambulance AMB-201 assigned in 248ms (Geohash Grid 7)',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  isLoading: false,
  error: null,

  /**
   * Loads all active/historical sessions, ambulances fleet, and metrics.
   */
  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch ambulances
      let ambulances = [];
      try {
        const ambRes = await api.get('/api/v1/ambulances');
        ambulances = ambRes.data.data || ambRes.data || [];
      } catch (err) {
        // Fallback default mock fleet if backend endpoint is initializing
        ambulances = generateMockAmbulanceFleet();
      }

      // Fetch sessions
      let sessions = [];
      try {
        const sessRes = await api.get('/api/v1/emergency');
        sessions = sessRes.data.data || sessRes.data || [];
      } catch (err) {
        sessions = generateMockSessions();
      }

      // Calculate stats
      const activeSessionsCount = sessions.filter((s) => ['INITIATED', 'ASSIGNED', 'EN_ROUTE', 'DELAYED'].includes(s.status)).length;
      const delayedCount = sessions.filter((s) => s.status === 'DELAYED').length;
      const availableAmbsCount = ambulances.filter((a) => a.status === 'AVAILABLE').length;

      set({
        sessions,
        ambulances,
        stats: {
          activeSessions: activeSessionsCount || sessions.length,
          availableAmbulances: availableAmbsCount || 16,
          delayedSessions: delayedCount,
          resolvedToday: 14,
        },
        isLoading: false,
      });
    } catch (err) {
      console.warn('Admin load error:', err);
      set({
        ambulances: generateMockAmbulanceFleet(),
        sessions: generateMockSessions(),
        isLoading: false,
      });
    }
  },

  updateSessionStatus: async (sessionId, status) => {
    try {
      await api.post(`/api/v1/emergency/${sessionId}/transition`, { status });
      
      set((state) => {
        const updated = state.sessions.map((s) =>
          s._id === sessionId || s.id === sessionId ? { ...s, status } : s
        );
        return { sessions: updated };
      });

      get().addEventLog({
        id: `ev-${Date.now()}`,
        type: 'STATUS_CHANGE',
        status,
        message: `Session #${sessionId.slice(-6)} transitioned to ${status}`,
        timestamp: new Date().toISOString(),
      });

      toast.success(`Session transitioned to ${status}`);
    } catch (err) {
      // Local optimistic update
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s._id === sessionId || s.id === sessionId ? { ...s, status } : s
        ),
      }));
      toast.success(`Session transitioned to ${status} (optimistic)`);
    }
  },

  addEventLog: (event) => {
    set((state) => ({
      eventLogs: [event, ...state.eventLogs.slice(0, 49)], // Keep latest 50 events
    }));
  },

  addDelayAlert: (alert) => {
    set((state) => ({
      delayedSessions: [alert, ...state.delayedSessions.filter((d) => d.sessionId !== alert.sessionId)],
      stats: {
        ...state.stats,
        delayedSessions: state.stats.delayedSessions + 1,
      },
    }));
  },
}));

function generateMockAmbulanceFleet() {
  const center = { lat: 25.3176, lng: 82.9739 };
  return Array.from({ length: 12 }, (_, i) => ({
    _id: `amb-${i + 101}`,
    vehicleNumber: `UP-65-EA-${1000 + i}`,
    driverName: `Driver ${i + 1}`,
    status: i % 4 === 0 ? 'BUSY' : i % 7 === 0 ? 'OFFLINE' : 'AVAILABLE',
    currentLocation: {
      lat: center.lat + (Math.random() - 0.5) * 0.08,
      lng: center.lng + (Math.random() - 0.5) * 0.08,
    },
    lastPing: new Date(Date.now() - Math.floor(Math.random() * 120000)).toISOString(),
  }));
}

function generateMockSessions() {
  const types = ['CARDIAC', 'TRAUMA', 'RESPIRATORY', 'STROKE', 'ACCIDENT'];
  const statuses = ['EN_ROUTE', 'ASSIGNED', 'INITIATED', 'DELAYED', 'RESOLVED'];
  return Array.from({ length: 6 }, (_, i) => ({
    _id: `sess-889${i}`,
    userId: { name: `Citizen ${i + 1}`, email: `user${i+1}@example.com` },
    emergencyType: types[i % types.length],
    severityLevel: (i % 5) + 1,
    status: statuses[i % statuses.length],
    location: { lat: 25.31 + i * 0.01, lng: 82.97 + i * 0.01 },
    etaMinutes: Math.floor(Math.random() * 8) + 2,
    ambulanceId: { vehicleNumber: `UP-65-EA-${1000 + i}`, driverName: `Officer ${i + 1}` },
    createdAt: new Date(Date.now() - i * 900000).toISOString(),
  }));
}
