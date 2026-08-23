import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const decoded = jwtDecode(accessToken);
    set({ user: { ...user, role: decoded.role?.toUpperCase() }, accessToken });
    return decoded.role?.toUpperCase();
  },

  register: async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { accessToken, refreshToken, user } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const decoded = jwtDecode(accessToken);
    set({ user: { ...user, role: decoded.role?.toUpperCase() }, accessToken });
    return decoded.role?.toUpperCase();
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {
        refreshToken: localStorage.getItem('refreshToken'),
      });
    } catch { /* ignore */ }
    localStorage.clear();
    set({ user: null, accessToken: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      const decoded = jwtDecode(token);
      const userData = res.data.user || res.data.data;
      set({
        user: { ...userData, role: decoded.role?.toUpperCase() },
        isLoading: false,
      });
    } catch {
      localStorage.clear();
      set({ user: null, accessToken: null, isLoading: false });
    }
  },
}));

export default useAuthStore;
