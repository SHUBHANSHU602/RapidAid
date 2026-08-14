import { jwtDecode } from 'jwt-decode';

/**
 * Decodes a JWT token safely.
 * @param {string} token 
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    return jwtDecode(token);
  } catch (err) {
    console.error('Failed to decode JWT token:', err);
    return null;
  }
};

/**
 * Checks if a JWT token is expired.
 * @param {string} token 
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Extracts and normalizes the user role from token.
 * @param {string} token 
 * @returns {'USER'|'DRIVER'|'ADMIN'|null}
 */
export const getRoleFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  const rawRole = decoded.role || decoded.userRole || '';
  return rawRole.toUpperCase();
};

/**
 * Extracts user details from token.
 * @param {string} token 
 * @returns {object|null}
 */
export const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return {
    userId: decoded.userId || decoded.id || decoded.sub,
    role: (decoded.role || 'USER').toUpperCase(),
    email: decoded.email || '',
    name: decoded.name || '',
    exp: decoded.exp,
  };
};
