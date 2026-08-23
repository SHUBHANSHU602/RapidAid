import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export function useAuth(requiredRole = null) {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (requiredRole && user.role?.toUpperCase() !== requiredRole.toUpperCase()) {
      const roleRoutes = { USER: '/dashboard', DRIVER: '/driver', ADMIN: '/admin' };
      navigate(roleRoutes[user.role?.toUpperCase()] || '/');
    }
  }, [user, isLoading, requiredRole, navigate]);

  return { user, isLoading };
}
