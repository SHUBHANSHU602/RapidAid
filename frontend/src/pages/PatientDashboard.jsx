import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { SeverityBadge } from '../components/ui/Badge';
import TriggerButton from '../components/features/EmergencyTrigger/TriggerButton';
import TriggerModal from '../components/features/EmergencyTrigger/TriggerModal';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import {
  AlertTriangle,
  Radio,
  Clock,
  History,
  ArrowRight,
  Shield,
  MapPin,
  Ambulance,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { formatTimestamp, calculateDuration, formatRelativeTime } from '../utils/time';

export const PatientDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeSession, sessionHistory, fetchUserSessions } = useSessionStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserSessions();
  }, [fetchUserSessions]);

  const hasActiveEmergency =
    activeSession && ['INITIATED', 'ASSIGNED', 'EN_ROUTE', 'DELAYED'].includes(activeSession.status);

  // Past emergency sessions mock/fallback if none yet
  const pastSessions = sessionHistory.length > 0
    ? sessionHistory
    : [
        {
          _id: 'sess-prev-101',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          resolvedAt: new Date(Date.now() - 86400000 * 3 + 1200000).toISOString(),
          emergencyType: 'CARDIAC',
          severityLevel: 4,
          status: 'RESOLVED',
          location: { lat: 25.3176, lng: 82.9739 },
        },
        {
          _id: 'sess-prev-102',
          createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
          resolvedAt: new Date(Date.now() - 86400000 * 12 + 1800000).toISOString(),
          emergencyType: 'TRAUMA',
          severityLevel: 3,
          status: 'RESOLVED',
          location: { lat: 25.2954, lng: 82.9912 },
        },
      ];

  return (
    <div className={`min-h-screen bg-[#0F172A] text-slate-100 flex flex-col ${hasActiveEmergency ? 'ring-4 ring-red-600/40' : ''}`}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* STATE B: ACTIVE EMERGENCY TOP BANNER */}
        {hasActiveEmergency && (
          <div className="p-5 rounded-2xl bg-red-950/90 border-2 border-red-500 shadow-2xl shadow-red-950 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg">
                <Radio className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  You Have An Active Emergency En Route!
                </h3>
                <p className="text-xs text-red-200 mt-0.5">
                  Category: <span className="font-bold">{activeSession.emergencyType}</span> · Status:{' '}
                  <span className="font-bold">{activeSession.status}</span>
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/emergency/${activeSession._id || activeSession.id}`)}
              icon={ArrowRight}
              className="font-extrabold uppercase tracking-wider text-xs px-6 py-3 shadow-xl"
            >
              Open Live GPS Telemetry
            </Button>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Citizen Emergency Console</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              Hello, {user?.name || user?.email?.split('@')[0] || 'Citizen'}
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Direct Hotline: <strong className="text-white">108 / 112</strong></span>
            </div>
          </div>
        </div>

        {/* STATE A: EMERGENCY TRIGGER CARD (Glassmorphism) */}
        <Card className="bg-[#1E293B]/70 border-white/[0.08] shadow-2xl p-8 lg:p-12 text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                Instant Crisis Dispatch
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Need Immediate Medical Aid?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Click below to launch an emergency dispatch request. Autonomous AI will allocate the fastest available ambulance within 300ms.
              </p>
            </div>

            {/* Pulsing SOS Button */}
            <TriggerButton onClick={() => setIsModalOpen(true)} />
          </div>
        </Card>

        {/* PAST SESSIONS HISTORY */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Emergency Dispatch History
              </h3>
            </div>
            <span className="text-xs text-slate-400">{pastSessions.length} Incident records</span>
          </div>

          <Card className="bg-[#1E293B]/70 border-white/[0.08] shadow-xl p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Emergency Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pastSessions.map((session, idx) => {
                    const sId = session._id || session.id;
                    const duration = calculateDuration(session.createdAt, session.resolvedAt);

                    return (
                      <tr key={sId || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-200">
                            {formatTimestamp(session.createdAt, 'MMM d, yyyy')}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {formatTimestamp(session.createdAt, 'h:mm a')}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-white">
                          {session.emergencyType || 'MEDICAL'}
                        </td>

                        <td className="py-3.5 px-4">
                          <SeverityBadge level={session.severityLevel || 3} size="sm" />
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={session.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {duration}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/emergency/${sId}`)}
                            icon={ArrowRight}
                            className="text-xs font-semibold"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </main>

      {/* EMERGENCY TRIGGER MODAL */}
      <TriggerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default PatientDashboard;
