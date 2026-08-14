import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import EmergencyTracking from './pages/EmergencyTracking';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';
import ToastProvider from './components/ui/Toast';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';

export const App = () => {
  const { loadUser, accessToken } = useAuthStore();
  const { initSocketListeners } = useSocketStore();

  useEffect(() => {
    loadUser();
    initSocketListeners();
  }, [loadUser, initSocketListeners]);

  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient Routes (USER) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['USER', 'ADMIN']}>
                  <PatientDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Active Emergency Tracking (USER, DRIVER, ADMIN) */}
          <Route
            path="/emergency/:id"
            element={
              <ProtectedRoute>
                <EmergencyTracking />
              </ProtectedRoute>
            }
          />

          {/* Driver Dashboard (DRIVER) */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['DRIVER', 'ADMIN']}>
                  <DriverDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Admin Control Center (ADMIN) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
