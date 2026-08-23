import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute() {
  const { user, isLoading, accessToken } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
