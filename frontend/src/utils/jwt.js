import { jwtDecode } from 'jwt-decode';

export function getRole() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.role?.toUpperCase();
  } catch {
    return null;
  }
}

export function getUserId() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    return jwtDecode(token).userId;
  } catch {
    return null;
  }
}

export function isTokenExpired() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return true;
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}
