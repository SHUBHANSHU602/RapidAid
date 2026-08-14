import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { SeverityBadge } from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import AssignmentCard from '../components/features/Driver/AssignmentCard';
import LocationEmitter from '../components/features/Driver/LocationEmitter';
import NavigationCard from '../components/features/Driver/NavigationCard';
import TrackingMap from '../components/map/TrackingMap';
import { useDriverStore } from '../store/driverStore';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { getSocket } from '../services/socket';
import {
  CheckCircle2,
  Ambulance,
  Power,
  Clock,
  TrendingUp,
  Radio,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DriverDashboard = () => {
  const {
    assignment,
    isOnline,
    isEmitting,
    speed,
    broadcastCount,
    deltaSkippedCount,
    lastEmission,
    lastCoordinates,
    todayTrips,
    averageEtaMinutes,
    toggleOnline,
    setAssignment,
    clearAssignment,
    startLocationEmit,
    stopLocationEmit,
  } = useDriverStore();

  const { user } = useAuthStore();
  const { transitionSession } = useSessionStore();

  // Listen for real-time ambulance_assigned dispatch via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAssignment = (data) => {
      console.log('[Driver Socket] ambulance_assigned received:', data);
      toast.success('🚨 NEW EMERGENCY ASSIGNMENT RECEIVED!');
      setAssignment({
        sessionId: data.sessionId,
        emergencyType: data.emergencyType || 'CARDIAC',
        severityLevel: data.severityLevel || 4,
        location: data.location || { lat: 25.3176, lng: 82.9739 },
        etaMinutes: Math.ceil((data.etaSeconds || 300) / 60),
        address: 'Varanasi Emergency Zone (Auto Geocoded)',
      });
    };

    socket.on('ambulance_assigned', handleAssignment);

    return () => {
      socket.off('ambulance_assigned', handleAssignment);
    };
  }, [setAssignment]);

  const handleStatusTransition = async (sessionId, status) => {
    await transitionSession(sessionId, status, { driverId: user?.userId });
  };

  const handleResolveSession = async (sessionId) => {
    await transitionSession(sessionId, 'RESOLVED', { driverId: user?.userId, resolvedAt: new Date() });
    clearAssignment();
    toast.success('Mission marked as RESOLVED. Ready for next dispatch.');
  };

  // Quick simulation helper for demonstration if no live socket assignment exists
  const handleSimulateDispatch = () => {
    const mockSessionId = `sess-${Date.now()}`;
    setAssignment({
      sessionId: mockSessionId,
      emergencyType: 'CARDIAC',
      severityLevel: 5,
      location: { lat: 25.3176 + (Math.random() - 0.5) * 0.02, lng: 82.9739 + (Math.random() - 0.5) * 0.02 },
      etaMinutes: 4,
      address: 'Near BHU Trauma Center, Varanasi',
    });
    toast.success('Simulated dispatch incoming!');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Driver Console Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                Driver Telemetry Console
              </span>
              <Badge variant="cyan" size="sm">DRIVER</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              {user?.name || 'Officer Driver'} · Unit UP-65
            </h1>
          </div>

          {/* Online/Offline Toggle Button */}
          <div className="flex items-center gap-3">
            <Button
              variant={isOnline ? 'success' : 'secondary'}
              size="md"
              icon={Power}
              onClick={toggleOnline}
              className="text-xs font-bold uppercase tracking-wider"
            >
              {isOnline ? 'ONLINE & READY' : 'GO ONLINE'}
            </Button>
          </div>
        </div>

        {/* STATE A: NO ACTIVE ASSIGNMENT */}
        {!assignment && (
          <div className="space-y-6">
            <Card className="bg-[#1E293B]/70 border-white/[0.08] shadow-2xl p-8 lg:p-12 text-center relative overflow-hidden">
              <div className="max-w-md mx-auto space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950">
                  <CheckCircle2 className="w-10 h-10 animate-pulse" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/30 text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Transmitter Active in Redis Registry</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    You Are Online & Available
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    Standing by for high-priority emergency dispatches. You will receive an immediate audio & visual alert when matched.
                  </p>
                </div>

                {/* Simulation trigger */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Play}
                    onClick={handleSimulateDispatch}
                    className="text-xs text-slate-400 hover:text-white border-slate-700"
                  >
                    Test / Simulate Dispatch Assignment
                  </Button>
                </div>
              </div>
            </Card>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-5 bg-[#1E293B]/70 border-white/[0.08]">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
                  <span>Completed Dispatches Today</span>
                  <Ambulance className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-black text-white">{todayTrips} Missions</div>
                <p className="text-[11px] text-emerald-400 mt-1">100% on-time response rate</p>
              </Card>

              <Card className="p-5 bg-[#1E293B]/70 border-white/[0.08]">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
                  <span>Average Response ETA</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-amber-400">{averageEtaMinutes} mins</div>
                <p className="text-[11px] text-slate-400 mt-1">Sub-300ms allocation advantage</p>
              </Card>

              <Card className="p-5 bg-[#1E293B]/70 border-white/[0.08]">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
                  <span>Fleet Readiness Score</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400">99.4%</div>
                <p className="text-[11px] text-slate-400 mt-1">Certified Level-3 trauma equipped</p>
              </Card>
            </div>
          </div>
        )}

        {/* STATE B: ACTIVE ASSIGNMENT PRESENT */}
        {assignment && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Assignment Details & Live Emitter Controls */}
            <div className="lg:col-span-5 space-y-6">
              {/* Assignment Alert Card */}
              <AssignmentCard assignment={assignment} />

              {/* Navigation Actions Card */}
              <NavigationCard
                sessionId={assignment.sessionId}
                patientLocation={assignment.location}
                currentStatus="EN_ROUTE"
                onTransitionStatus={handleStatusTransition}
                onResolveSession={handleResolveSession}
              />

              {/* GPS Emitter Telemetry Status */}
              <LocationEmitter
                isEmitting={isEmitting}
                speed={speed}
                lastEmission={lastEmission}
                broadcastCount={broadcastCount}
                deltaSkippedCount={deltaSkippedCount}
              />
            </div>

            {/* Right Column: Interactive Tactical Map */}
            <div className="lg:col-span-7 h-[500px] lg:h-auto min-h-[500px]">
              <TrackingMap
                patientLocation={assignment.location}
                ambulanceLocation={lastCoordinates ? { latitude: lastCoordinates.lat, longitude: lastCoordinates.lng } : null}
                driverName={user?.name || 'Officer Driver'}
                vehicleNumber="Unit UP-65"
                status="EN_ROUTE"
              />
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default DriverDashboard;
