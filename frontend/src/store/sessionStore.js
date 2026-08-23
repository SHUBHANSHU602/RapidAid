import { create } from 'zustand';
import api from '../services/api';

const useSessionStore = create((set, get) => ({
  activeSession: null,
  sessions: [],
  isLoading: false,

  triggerEmergency: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/emergency/trigger', data);
      const session = res.data.data;
      set({ activeSession: session, isLoading: false });
      return session;
    } catch (err) {
      set({ isLoading: false });
      if (err.response?.status === 409) {
        throw new Error('ACTIVE_SESSION_EXISTS');
      }
      throw err;
    }
  },

  loadSession: async (sessionId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/emergency/${sessionId}`);
      set({ activeSession: res.data.data, isLoading: false });
      return res.data.data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loadSessions: async () => {
    const res = await api.get('/emergency');
    set({ sessions: res.data.data || [] });
  },

  updateActiveSession: (updates) => {
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, ...updates }
        : null,
    }));
  },

  clearActiveSession: () => set({ activeSession: null }),
}));

export default useSessionStore;
