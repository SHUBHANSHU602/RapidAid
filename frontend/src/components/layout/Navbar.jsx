import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Wifi, WifiOff, Ambulance } from 'lucide-react';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import { getSocket } from '../../services/socket';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [socketStatus, setSocketStatus] = useState('disconnected');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const socket = getSocket();

    const onConnect = () => setSocketStatus('connected');
    const onDisconnect = () => setSocketStatus('disconnected');
    const onReconnecting = () => setSocketStatus('reconnecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnecting);

    if (socket.connected) setSocketStatus('connected');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnecting);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const statusDot = {
    connected: 'bg-accent-green animate-pulse',
    disconnected: 'bg-red-500',
    reconnecting: 'bg-accent-amber animate-spin',
  };

  const statusText = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    reconnecting: 'Reconnecting...',
  };

  const role = user?.role?.toUpperCase();
  const homeRoute = role === 'ADMIN' ? '/admin' : role === 'DRIVER' ? '/driver' : '/dashboard';

  return (
    <nav className="bg-bg-card border-b border-border-light px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link to={homeRoute} className="flex items-center gap-2 group">
        <div className="w-8 h-8 bg-accent-red rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
          <Ambulance className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-text-primary tracking-tight">
          Rapid<span className="text-accent-red">Aid</span>
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {role && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
            role === 'ADMIN' ? 'bg-accent-red/20 text-accent-red' :
            role === 'DRIVER' ? 'bg-accent-blue/20 text-accent-blue' :
            'bg-accent-green/20 text-accent-green'
          }`}>
            {role}
          </span>
        )}

        <div className="flex items-center gap-1.5 group relative">
          <div className={`w-2 h-2 rounded-full ${statusDot[socketStatus]}`} />
          {socketStatus === 'connected' ? (
            <Wifi className="w-3.5 h-3.5 text-accent-green" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          )}
          <div className="absolute top-full right-0 mt-1 px-2 py-1 glass text-xs text-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Socket: {statusText[socketStatus]}
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-red/20 flex items-center justify-center text-sm font-semibold text-accent-red">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm text-text-primary hidden sm:block">{user.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
