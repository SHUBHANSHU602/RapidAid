import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { connectSocket } from './services/socket';
import ToastProvider from './components/ui/Toast';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import EmergencyTracking from './pages/EmergencyTracking';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';

import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';

function App() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
    if (localStorage.getItem('accessToken')) {
      connectSocket();
    }
  }, [loadUser]);

  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['USER']} />}>
            <Route path="/dashboard" element={<PatientDashboard />} />
            <Route path="/emergency/:id" element={<EmergencyTracking />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['DRIVER']} />}>
            <Route path="/driver" element={<DriverDashboard />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
