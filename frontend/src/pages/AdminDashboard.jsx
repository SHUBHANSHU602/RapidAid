import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import StatsRow from '../components/features/Admin/StatsRow';
import SessionsTable from '../components/features/Admin/SessionsTable';
import FleetMap from '../components/map/FleetMap';
import DelayedAlertFeed from '../components/features/Admin/DelayedAlertFeed';
import EventFeed from '../components/features/Admin/EventFeed';
import QuickActions from '../components/features/Admin/QuickActions';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAdminStore } from '../store/adminStore';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../services/socket';
import { Shield, Radio, Activity, RefreshCw, Layers, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const {
    sessions,
    ambulances,
    stats,
    delayedSessions,
    eventLogs,
    isLoading,
    loadAll,
    updateSessionStatus,
    addEventLog,
    addDelayAlert,
  } = useAdminStore();

  const { user } = useAuthStore();

  // Initial data load + 30s auto-refresh interval
  useEffect(() => {
    loadAll();

    const interval = setInterval(() => {
      loadAll();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAll]);

  // Subscribe to real-time system socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDelay = (data) => {
      console.log('[Admin Socket] delay_detected:', data);
      addDelayAlert({
        sessionId: data.sessionId,
        drift: data.drift || 3,
        currentEta: data.currentEta || 8,
        message: data.message || 'Traffic delay detected',
        timestamp: new Date().toISOString(),
      });
      addEventLog({
        id: `ev-delay-${Date.now()}`,
        type: 'DELAY_ALERT',
        status: 'DELAYED',
        message: `Drift anomaly on session #${data.sessionId?.slice(-6)}: +${data.drift || 3}m`,
        timestamp: new Date().toISOString(),
      });
    };

    const handleStatusChanged = (data) => {
      console.log('[Admin Socket] session_status_changed:', data);
      addEventLog({
        id: `ev-status-${Date.now()}`,
        type: 'STATUS_CHANGE',
        status: data.newStatus,
        message: `Session #${data.sessionId?.slice(-6) || 'General'} transitioned from ${data.previousStatus || 'PREV'} to ${data.newStatus}`,
        timestamp: new Date().toISOString(),
      });
      loadAll();
    };

    socket.on('delay_detected', handleDelay);
    socket.on('session_status_changed', handleStatusChanged);

    return () => {
      socket.off('delay_detected', handleDelay);
      socket.off('session_status_changed', handleStatusChanged);
    };
  }, [addDelayAlert, addEventLog, loadAll]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                Central Command Center
              </span>
              <Badge variant="purple" size="sm">ADMIN</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              RapidAid Fleet & Dispatch Intelligence
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadAll();
                toast.success('Admin telemetries synced');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync All Feeds</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards Row */}
        <StatsRow stats={stats} />

        {/* Main Grid: Two Columns (Left Data & Fleet Map, Right Alerts & Logs) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (7 Cols): Live Sessions Queue + Ambulance Fleet Map */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Sessions Table */}
            <SessionsTable
              sessions={sessions}
              onTransitionStatus={updateSessionStatus}
              isLoading={isLoading}
              onRefresh={loadAll}
            />

            {/* Ambulance Fleet Map */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Live Geohash Fleet Grid ({ambulances.length} Units)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Varanasi Dispatch Sector</span>
              </div>

              <FleetMap ambulances={ambulances} />
            </div>
          </div>

          {/* RIGHT COLUMN (5 Cols): Delay Alerts Feed + Live Event Stream + Quick Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delayed Sessions Alert Feed */}
            <DelayedAlertFeed delayedAlerts={delayedSessions} />

            {/* Real-time System Event Feed */}
            <EventFeed events={eventLogs} />

            {/* Quick Actions & DB Seeding */}
            <QuickActions onRefreshData={loadAll} />
          </div>

        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
