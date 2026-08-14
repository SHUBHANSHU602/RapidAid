import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { FullPageLoader } from '../ui/Spinner';

export const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, isLoading } = useAuthStore();

  if (isLoading) {
    return <FullPageLoader text="Verifying role permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (role || 'USER').toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  if (!normalizedAllowed.includes(userRole)) {
    // Redirect to correct dashboard based on actual role
    if (userRole === 'ADMIN') return <Navigate to="/admin" replace />;
    if (userRole === 'DRIVER') return <Navigate to="/driver" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
