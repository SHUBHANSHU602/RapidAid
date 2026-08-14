import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import { SeverityBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { FullPageLoader } from '../components/ui/Spinner';
import TrackingMap from '../components/map/TrackingMap';
import ETACard from '../components/features/Tracking/ETACard';
import DelayAlert from '../components/features/Tracking/DelayAlert';
import AICard from '../components/features/Tracking/AICard';
import FirstAidCard from '../components/features/Tracking/FirstAidCard';
import AmbulanceSwapped from '../components/features/Tracking/AmbulanceSwapped';
import DriverDisconnected from '../components/features/Tracking/DriverDisconnected';
import EventLog from '../components/features/Tracking/EventLog';
import { useSessionStore } from '../store/sessionStore';
import { getSocket, joinSession } from '../services/socket';
import { Shield, ArrowLeft, Radio, AlertCircle, Phone, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const EmergencyTracking = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const {
    activeSession,
    driverLocation,
    etaInfo,
    delayAlert,
    aiSuggestion,
    firstAid,
    ambulanceSwapped,
    driverDisconnected,
    isLoading,
    fetchSession,
    setDriverLocation,
    setEtaInfo,
    setDelayAlert,
    setAiSuggestion,
    setFirstAid,
    setAmbulanceSwapped,
    setDriverDisconnected,
    updateSessionStatus,
  } = useSessionStore();

  const [initialLoaded, setInitialLoaded] = useState(false);

  // 1. Load session from API on mount (handles page refresh)
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (sessionId) {
        await fetchSession(sessionId);
        if (isMounted) {
          setInitialLoaded(true);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [sessionId, fetchSession]);

  // 2. Connect Socket and subscribe to all real-time events with guaranteed cleanup
  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();
    if (!socket) return;

    // Join session room
    joinSession(sessionId);

    // Handler: ambulance_assigned
    const handleAmbulanceAssigned = (data) => {
      console.log('[Socket] ambulance_assigned:', data);
      toast.success(data.message || 'Ambulance assigned and en route!');
      updateSessionStatus('ASSIGNED', data);
      if (data.etaSeconds) {
        setEtaInfo({
          etaMinutes: Math.ceil(data.etaSeconds / 60),
          calculatedAt: new Date().toISOString(),
        });
      }
    };

    // Handler: driver_location
    const handleDriverLocation = (data) => {
      if (data.latitude && data.longitude) {
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.timestamp || new Date().toISOString(),
        });
      }
    };

    // Handler: eta_update
    const handleEtaUpdate = (data) => {
      console.log('[Socket] eta_update:', data);
      if (data.etaMinutes !== undefined) {
        setEtaInfo({
          etaMinutes: data.etaMinutes,
          calculatedAt: data.calculatedAt || new Date().toISOString(),
        });
      }
    };

    // Handler: delay_detected
    const handleDelayDetected = (data) => {
      console.log('[Socket] delay_detected:', data);
      setDelayAlert(data);
      updateSessionStatus('DELAYED', data);
      toast.error(`⚠️ Route delay detected (+${data.drift || 3}m)`);
    };

    // Handler: driver_disconnected
    const handleDriverDisconnected = (data) => {
      console.log('[Socket] driver_disconnected:', data);
      setDriverDisconnected(data);
      toast('Driver signal temporarily interrupted', { icon: '📡' });
    };

    // Handler: session_status_changed
    const handleStatusChanged = (data) => {
      console.log('[Socket] session_status_changed:', data);
      if (data.newStatus) {
        updateSessionStatus(data.newStatus, data);
        toast.success(`Emergency status updated to ${data.newStatus}`);
      }
    };

    // Handler: ambulance_swapped
    const handleAmbulanceSwapped = (data) => {
      console.log('[Socket] ambulance_swapped:', data);
      setAmbulanceSwapped(data);
      toast('Ambulance reassigned to closer vehicle', { icon: '⚡' });
    };

    // Handler: ai_suggestion
    const handleAiSuggestion = (data) => {
      console.log('[Socket] ai_suggestion:', data);
      setAiSuggestion(data);
    };

    // Handler: first_aid_instructions
    const handleFirstAid = (data) => {
      console.log('[Socket] first_aid_instructions:', data);
      setFirstAid(data);
    };

    // Handler: route_updated
    const handleRouteUpdated = (data) => {
      console.log('[Socket] route_updated:', data);
      if (data.newEta) {
        setEtaInfo({
          etaMinutes: data.newEta,
          calculatedAt: new Date().toISOString(),
        });
      }
    };

    // Register all socket listeners
    socket.on('ambulance_assigned', handleAmbulanceAssigned);
    socket.on('driver_location', handleDriverLocation);
    socket.on('eta_update', handleEtaUpdate);
    socket.on('delay_detected', handleDelayDetected);
    socket.on('driver_disconnected', handleDriverDisconnected);
    socket.on('session_status_changed', handleStatusChanged);
    socket.on('ambulance_swapped', handleAmbulanceSwapped);
    socket.on('ai_suggestion', handleAiSuggestion);
    socket.on('first_aid_instructions', handleFirstAid);
    socket.on('route_updated', handleRouteUpdated);

    // CLEANUP ALL EVENT LISTENERS ON UNMOUNT (Rule 1)
    return () => {
      socket.off('ambulance_assigned', handleAmbulanceAssigned);
      socket.off('driver_location', handleDriverLocation);
      socket.off('eta_update', handleEtaUpdate);
      socket.off('delay_detected', handleDelayDetected);
      socket.off('driver_disconnected', handleDriverDisconnected);
      socket.off('session_status_changed', handleStatusChanged);
      socket.off('ambulance_swapped', handleAmbulanceSwapped);
      socket.off('ai_suggestion', handleAiSuggestion);
      socket.off('first_aid_instructions', handleFirstAid);
      socket.off('route_updated', handleRouteUpdated);
    };
  }, [
    sessionId,
    setDriverLocation,
    setEtaInfo,
    setDelayAlert,
    setAiSuggestion,
    setFirstAid,
    setAmbulanceSwapped,
    setDriverDisconnected,
    updateSessionStatus,
  ]);

  if (!initialLoaded && isLoading) {
    return <FullPageLoader text="Loading Active Emergency Telemetry..." />;
  }

  const patientLoc = activeSession?.location || { lat: 25.3176, lng: 82.9739 };
  const currentStatus = activeSession?.status || 'EN_ROUTE';
  const etaMinutes = etaInfo?.etaMinutes || 5;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <Navbar />

      {/* Main Full-Screen Layout: Split 40% Left Telemetry / 60% Right Map */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT PANEL (40% width, dark, scrollable) */}
        <div className="w-full lg:w-[42%] xl:w-[38%] p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-64px)] border-r border-white/[0.08] bg-[#0F172A]/95">
          
          {/* Top Bar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                Live Incident Room
              </span>
            </div>
          </div>

          {/* Session Header Card */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                SESSION ID: #{sessionId?.slice(-8) || '88921'}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {activeSession?.emergencyType || 'CARDIAC'} Incident
                </h2>
                <SeverityBadge level={activeSession?.severityLevel || 4} size="sm" />
              </div>
            </div>

            <StatusBadge status={currentStatus} size="md" />
          </div>

          {/* Alert Banners (Dynamic Sockets) */}
          {ambulanceSwapped && <AmbulanceSwapped swapData={ambulanceSwapped} />}
          {delayAlert && <DelayAlert delayData={delayAlert} />}
          {driverDisconnected && <DriverDisconnected disconnectData={driverDisconnected} />}

          {/* Ambulance Info & ETA Card */}
          <ETACard
            driverName={activeSession?.ambulanceId?.driverName || 'Officer R. Sharma'}
            vehicleNumber={activeSession?.ambulanceId?.vehicleNumber || 'RapidAid Unit 104'}
            etaMinutes={etaMinutes}
            status={currentStatus}
            hospitalName={activeSession?.hospitalId?.name || 'Sir Sunderlal Hospital (BHU)'}
          />

          {/* AI Suggestion Card (LLaMA 3) */}
          {aiSuggestion && <AICard aiData={aiSuggestion} />}

          {/* First Aid Instructions Checklist */}
          {firstAid && <FirstAidCard firstAidData={firstAid} />}

          {/* Event Log Collapsible Timeline */}
          <EventLog eventLog={activeSession?.eventLog || []} />
        </div>

        {/* RIGHT PANEL (60% width, Full-Height Interactive Map) */}
        <div className="w-full lg:w-[58%] xl:w-[62%] h-[450px] lg:h-[calc(100vh-64px)] relative bg-[#0B1120] p-3 lg:p-4">
          <TrackingMap
            patientLocation={patientLoc}
            ambulanceLocation={driverLocation}
            driverName={activeSession?.ambulanceId?.driverName || 'Officer R. Sharma'}
            vehicleNumber={activeSession?.ambulanceId?.vehicleNumber || 'RapidAid Unit 104'}
            status={currentStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default EmergencyTracking;
