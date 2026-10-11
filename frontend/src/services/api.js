import axios from 'axios';
import { updateSocketToken } from './socket';

const API_ROOT = (import.meta.env.VITE_API_URL || '') + '/api/v1';

const api = axios.create({
  baseURL: API_ROOT,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('Refresh token missing');

      const res = await axios.post(`${API_ROOT}/auth/refresh-token`, { refreshToken });
      const { accessToken, refreshToken: nextRefreshToken } = res.data;

      if (!accessToken) throw new Error('Refresh response did not include an access token');

      localStorage.setItem('accessToken', accessToken);
      if (nextRefreshToken) localStorage.setItem('refreshToken', nextRefreshToken);
      updateSocketToken(accessToken);

      return accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (
      err.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh-token')
    ) {
      original._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshErr) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
