import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, HeartPulse, History, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useSessionStore from '../store/sessionStore';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import { timeAgo } from '../utils/time';
import TriggerModal from '../components/features/emergency/TriggerModal';

// ── Static fallback first aid by emergency type ──────────────────────────────
const BASIC_FIRST_AID = {
  CARDIAC: {
    title: 'Heart Emergency — Do This Now',
    steps: [
      'Ask the person to sit or lie down in a comfortable position',
      'Loosen any tight clothing around the chest and neck',
      'If the person is unresponsive, begin CPR immediately',
      'Do not give food or water',
      'Stay with the person until help arrives',
    ],
    warnings: ['Do not leave the person alone', 'Call for additional help if needed'],
  },
  ACCIDENT: {
    title: 'Accident Emergency — Do This Now',
    steps: [
      'Do not move the patient unless in immediate danger',
      'Apply firm pressure to any bleeding wounds with clean cloth',
      'Keep the patient warm with a blanket or jacket',
      'Check for breathing and consciousness every minute',
      'Clear the area of hazards if safe to do so',
    ],
    warnings: ['Do not remove objects embedded in wounds', 'Do not straighten broken limbs'],
  },
  SNAKE_BITE: {
    title: 'Snake Bite — Do This Now',
    steps: [
      'Keep the patient still and calm',
      'Keep the bitten limb below heart level',
      'Remove rings and tight clothing near the bite',
      'Clean the bite area gently with soap and water',
      'Note the time of the bite and snake appearance if seen',
    ],
    warnings: ['Do NOT suck the venom', 'Do NOT apply a tourniquet', 'Do NOT apply ice'],
  },
  FIRE: {
    title: 'Fire / Burn Emergency — Do This Now',
    steps: [
      'Move the person away from the fire or heat source',
      'Cool the burn under cool running water for 10-20 minutes',
      'Remove clothing and jewelry near the burn if not stuck',
      'Cover the burn loosely with a clean, non-fluffy material',
      'Do not pop blisters',
    ],
    warnings: ['Do NOT apply butter, oil, or toothpaste to burns', 'Do NOT use ice directly on burns'],
  },
  STROKE: {
    title: 'Stroke Emergency — Do This Now',
    steps: [
      'Note the exact time symptoms started',
      'Ask the person to smile — check for facial drooping',
      'Ask them to raise both arms — check for weakness',
      'Ask them to repeat a simple sentence — check for slurred speech',
      'Lay them down with head slightly elevated',
    ],
    warnings: ['Do NOT give food or water — choking risk', 'Time is critical — every minute counts'],
  },
  BREATHING: {
    title: 'Breathing Difficulty — Do This Now',
    steps: [
      'Help the person sit upright in a comfortable position',
      'Loosen any tight clothing around chest and neck',
      'If they have an inhaler, help them use it',
      'Open windows for fresh air if indoors',
      'Keep the person calm — anxiety worsens breathing',
    ],
    warnings: ['Do not lay the person flat', 'If breathing stops, begin CPR'],
  },
  HEAD_INJURY: {
    title: 'Head Injury — Do This Now',
    steps: [
      'Keep the person still — do not move the neck',
      'Apply gentle pressure to bleeding wounds with clean cloth',
      'Keep the person awake and talking if conscious',
      'Monitor for vomiting — turn to side if they vomit',
      'Note any changes in pupil size or consciousness',
    ],
    warnings: ['Do NOT remove helmets', 'Do NOT give painkillers without medical advice'],
  },
  BURNS: {
    title: 'Burn Injury — Do This Now',
    steps: [
      'Cool the burn under cool running water for 10-20 minutes',
      'Remove clothing near the burn if not stuck to skin',
      'Cover loosely with clean non-stick dressing',
      'Do not pop any blisters that form',
      'Give small sips of water if conscious',
    ],
    warnings: ['Do NOT apply ice, butter, or oil', 'Do NOT use fluffy cotton on burns'],
  },
  POISONING: {
    title: 'Poisoning Emergency — Do This Now',
    steps: [
      'Try to identify the poison — keep the container',
      'Do NOT induce vomiting unless instructed by medical staff',
      'If poison is on skin, remove contaminated clothing',
      'If inhaled, move person to fresh air immediately',
      'Monitor breathing and consciousness',
    ],
    warnings: ['Do NOT give anything to eat or drink', 'Save any vomit sample for medical team'],
  },
  PREGNANCY: {
    title: 'Pregnancy Emergency — Do This Now',
    steps: [
      'Help the person lie on their left side',
      'Keep them warm and comfortable',
      'Time any contractions if occurring',
      'Do not give food or water',
      'Keep the area clean and private',
    ],
    warnings: ['Do NOT press on the abdomen', 'If heavy bleeding, elevate legs slightly'],
  },
  TRAUMA: {
    title: 'Trauma Emergency — Do This Now',
    steps: [
      'Check for life-threatening bleeding first',
      'Apply direct pressure to major wounds',
      'Keep the spine still — do not move unnecessarily',
      'Cover the person to prevent hypothermia',
      'Monitor breathing and pulse continuously',
    ],
    warnings: ['Do NOT remove impaled objects', 'Do NOT give food or water'],
  },
  RESPIRATORY: {
    title: 'Respiratory Emergency — Do This Now',
    steps: [
      'Sit the person upright — do not lay flat',
      'Loosen any restrictive clothing',
      'Help use prescribed inhaler if available',
      'Open doors/windows for ventilation',
      'If breathing stops, begin rescue breathing',
    ],
    warnings: ['Do not give water if choking risk', 'Call for backup help immediately'],
  },
  NEUROLOGICAL: {
    title: 'Neurological Emergency — Do This Now',
    steps: [
      'Keep the person safe from injury during seizures',
      'Do NOT restrain them or put anything in their mouth',
      'Turn them on their side once seizure stops',
      'Note the time and duration of symptoms',
      'Stay calm and reassure the person',
    ],
    warnings: ['Do NOT hold them down during seizures', 'Do NOT give oral medication during episode'],
  },
  OTHER: {
    title: 'Emergency First Aid — Do This Now',
    steps: [
      'Keep the patient calm and reassured',
      'Do not give food or water unless instructed',
      'Monitor breathing and consciousness',
      'Keep the patient warm and comfortable',
      'Stay with the patient until help arrives',
    ],
    warnings: ['Do not move the patient unless in danger', 'Note any symptoms or changes'],
  },
};

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const { sessions, loadSessions, clearActiveSession } = useSessionStore();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const activeSessions = sessions.filter(s => !['RESOLVED', 'CANCELLED'].includes(s.status));
  const pastSessions = sessions.filter(s => ['RESOLVED', 'CANCELLED'].includes(s.status));
  const hasActiveEmergency = activeSessions.length > 0;

  // ── Cancel emergency handler ───────────────────────────────────────────────
  const handleCancel = async (sessionId) => {
    const confirmed = window.confirm(
      'Cancel this emergency? Only do this if help has already arrived or is no longer needed.'
    );
    if (!confirmed) return;
    
    setIsCancelling(true);
    try {
      await api.post(`/emergency/${sessionId}/cancel`);
      toast.success('Emergency cancelled');
      clearActiveSession();
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setIsCancelling(false);
    }
  };

  // ── SOS button handler ─────────────────────────────────────────────────────
  const handleSOSClick = () => {
    if (hasActiveEmergency) {
      toast.error('You already have an active emergency. Cancel it first.');
      return;
    }
    setIsModalOpen(true);
  };

  // ── Get first aid data for a session ────────────────────────────────────────
  const getFirstAidForSession = (session) => {
    if (session.generalFirstAid) return session.generalFirstAid;
    return BASIC_FIRST_AID[session.emergencyType] || BASIC_FIRST_AID.OTHER;
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">Welcome, {user?.name}</h1>
          <p className="text-text-muted">How can we help you today?</p>
        </header>

        {/* ── Active Emergency Cards ────────────────────────────────────────── */}
        {activeSessions.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-red"></span>
              </span>
              Active Emergency
            </h2>
            <div className="grid gap-4">
              {activeSessions.map(session => {
                const firstAid = getFirstAidForSession(session);
                return (
                  <div key={session._id} className="space-y-4">
                    {/* Emergency Card */}
                    <Card variant="red" className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{session.emergencyType?.replace(/_/g, ' ')}</h3>
                            <StatusBadge status={session.status} />
                          </div>
                          <p className="text-sm text-text-muted">{timeAgo(session.createdAt)}</p>
                        </div>
                        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="primary" 
                          className="flex-1" 
                          onClick={() => navigate(`/emergency/${session._id}`)}
                        >
                          View Live Tracking
                        </Button>
                        <Button
                          variant="outline"
                          className="border-slate-500/50 text-slate-300 hover:bg-slate-700/30"
                          onClick={() => handleCancel(session._id)}
                          loading={isCancelling}
                        >
                          Cancel Emergency
                        </Button>
                      </div>
                    </Card>

                    {/* First Aid Card */}
                    {firstAid && (
                      <Card variant="green" className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🩺</span>
                          <h3 className="font-bold text-green-300">First Aid While You Wait</h3>
                          <Badge color="green">General First Aid</Badge>
                        </div>
                        <h4 className="font-semibold text-text-primary">{firstAid.title}</h4>
                        <ol className="space-y-2 pl-1">
                          {firstAid.steps?.map((step, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-text-muted">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <span className="pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                        {firstAid.warnings && firstAid.warnings.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-amber-500/20">
                            {firstAid.warnings.map((w, idx) => (
                              <p key={idx} className="text-xs text-amber-400 flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                {w}
                              </p>
                            ))}
                          </div>
                        )}
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SOS Button ───────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center justify-center py-12 space-y-6">
          <button 
            className="sos-button flex flex-col items-center justify-center"
            onClick={handleSOSClick}
            style={hasActiveEmergency ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            title={hasActiveEmergency ? 'Cancel your active emergency first' : 'Trigger SOS'}
          >
            <span>SOS</span>
          </button>
          <p className="text-text-muted text-center max-w-xs">
            {hasActiveEmergency 
              ? 'You have an active emergency. Cancel it before triggering a new one.'
              : 'Tap the SOS button to instantly dispatch an ambulance to your location.'
            }
          </p>
        </section>

        <TriggerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        {/* ── Past Sessions ─────────────────────────────────────────────────── */}
        {pastSessions.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-text-muted" />
              Past Emergencies
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {pastSessions.map(session => (
                <Card key={session._id} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{session.emergencyType?.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-text-muted">{new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
