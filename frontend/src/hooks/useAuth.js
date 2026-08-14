import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, role, isAuthenticated, isLoading, error, login, register, logout } = useAuthStore();

  const isUser = role === 'USER';
  const isDriver = role === 'DRIVER';
  const isAdmin = role === 'ADMIN';

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    error,
    isUser,
    isDriver,
    isAdmin,
    login,
    register,
    logout,
  };
};

export default useAuth;
