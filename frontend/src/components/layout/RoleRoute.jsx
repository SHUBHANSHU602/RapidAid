import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const roleRoutes = { USER: '/dashboard', DRIVER: '/driver', ADMIN: '/admin' };

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuthStore();
  const userRole = user?.role?.toUpperCase();

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to={roleRoutes[userRole] || '/'} replace />;
  }

  return <Outlet />;
}
