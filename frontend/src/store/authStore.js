import { create } from 'zustand';
import api from '../services/api';
import { decodeToken, isTokenExpired, getUserFromToken, getRoleFromToken } from '../utils/jwt';
import { connectSocket, disconnectSocket } from '../services/socket';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /**
   * Initializes user session from localStorage tokens on app boot.
   */
  loadUser: async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken || isTokenExpired(accessToken)) {
      if (refreshToken) {
        try {
          const res = await api.post('/api/v1/auth/refresh-token', { refreshToken });
          const newAccess = res.data.accessToken;
          const newRefresh = res.data.refreshToken || refreshToken;

          localStorage.setItem('accessToken', newAccess);
          localStorage.setItem('refreshToken', newRefresh);

          const decodedUser = getUserFromToken(newAccess);
          const userRole = getRoleFromToken(newAccess);

          set({
            user: decodedUser,
            accessToken: newAccess,
            refreshToken: newRefresh,
            role: userRole,
            isAuthenticated: true,
            isLoading: false,
          });

          connectSocket(newAccess);
          return;
        } catch (err) {
          console.warn('Silent token refresh failed on boot');
        }
      }

      // No valid token
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, accessToken: null, refreshToken: null, role: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Token is valid
    const decodedUser = getUserFromToken(accessToken);
    const userRole = getRoleFromToken(accessToken);

    set({
      user: decodedUser,
      accessToken,
      refreshToken,
      role: userRole,
      isAuthenticated: true,
      isLoading: false,
    });

    connectSocket(accessToken);

    // Fetch fresh user profile in background
    try {
      const res = await api.get('/api/v1/auth/me');
      if (res.data?.user) {
        set((state) => ({
          user: {
            ...state.user,
            ...res.data.user,
            role: (res.data.user.role || state.role || 'USER').toUpperCase(),
          },
        }));
      }
    } catch (err) {
      // Ignore background profile fetch failure
    }
  },

  /**
   * Logs in a user, stores tokens, decodes role client-side, and initializes socket.
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/v1/auth/login', { email, password });
      const { accessToken, refreshToken } = response.data;

      if (!accessToken) {
        throw new Error('No access token received from server');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // STRICT RULE: Decode role client-side via jwt-decode, never trust response body role blindly
      const decodedUser = getUserFromToken(accessToken);
      const role = getRoleFromToken(accessToken);

      set({
        user: decodedUser,
        accessToken,
        refreshToken: refreshToken || null,
        role,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      connectSocket(accessToken);
      toast.success(`Welcome back, ${decodedUser.name || 'User'}!`);
      return { success: true, role, user: decodedUser };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: errorMsg });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Registers a new account (USER or DRIVER).
   */
  register: async ({ name, email, password, role }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/v1/auth/register', {
        name,
        email,
        password,
        role: role.toUpperCase(),
      });

      const { accessToken, refreshToken } = response.data;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        const decodedUser = getUserFromToken(accessToken);
        const userRole = getRoleFromToken(accessToken);

        set({
          user: decodedUser,
          accessToken,
          refreshToken: refreshToken || null,
          role: userRole,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        connectSocket(accessToken);
        toast.success('Account created successfully!');
        return { success: true, role: userRole, user: decodedUser };
      }

      set({ isLoading: false });
      toast.success('Registration successful! Please log in.');
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: errorMsg });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Logs out user and cleans up tokens & socket.
   */
  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (err) {
      // Ignore API logout error
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      disconnectSocket();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      toast.success('Logged out successfully');
    }
  },
}));
