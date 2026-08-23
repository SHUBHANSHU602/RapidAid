import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, MessageCircle, AlertTriangle, Clock, Truck, Hospital, Bot, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useSessionStore from '../store/sessionStore';
import { useJoinSession, useSocketEvent } from '../hooks/useSocket';
import Navbar from '../components/layout/Navbar';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Skeleton from '../components/ui/Skeleton';
import TrackingMap from '../components/map/TrackingMap';
import ChatPanel from '../components/features/chat/ChatPanel';
import { timeAgo } from '../utils/time';

// ═══════════════════════════════════════════════════════════════════════════════
// SEVERITY CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const SEVERITY_CONFIG = {
  1: { label: 'MINOR', color: 'blue' },
  2: { label: 'LOW', color: 'blue' },
  3: { label: 'MODERATE', color: 'amber' },
  4: { label: 'SEVERE', color: 'red' },
  5: { label: 'CRITICAL', color: 'red' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCY TYPE EMOJIS
// ═══════════════════════════════════════════════════════════════════════════════
const TYPE_EMOJI = {
  CARDIAC: '❤️', ACCIDENT: '🚗', FIRE: '🔥', STROKE: '🧠', SNAKE_BITE: '🐍',
  BREATHING: '🫁', HEAD_INJURY: '🤕', BURNS: '🔥', POISONING: '☠️',
  PREGNANCY: '🤰', TRAUMA: '🩸', RESPIRATORY: '🫁', NEUROLOGICAL: '🧠', OTHER: '🚨',
};

export default function EmergencyTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadSession, activeSession, isLoading, updateActiveSession } = useSessionStore();
  const [error, setError] = useState(null);

  // ── First Aid State ──────────────────────────────────────────────────────────
  const [generalFirstAid, setGeneralFirstAid] = useState(null);
  const [specialisedFirstAid, setSpecialisedFirstAid] = useState(null);

  // ── Ambulance / ETA State ───────────────────────────────────────────────────
  const [ambulanceInfo, setAmbulanceInfo] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [initialEta, setInitialEta] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);

  // ── Hospital State ──────────────────────────────────────────────────────────
  const [hospitalRanking, setHospitalRanking] = useState(null);

  // ── Chat State ──────────────────────────────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Alert State ─────────────────────────────────────────────────────────────
  const [delayInfo, setDelayInfo] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [driverArrived, setDriverArrived] = useState(false);
  const [driverDisconnected, setDriverDisconnected] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  // ── Load session on mount ───────────────────────────────────────────────────
  useEffect(() => {
    loadSession(id)
      .then((session) => {
        // Hydrate state from session data
        if (session.generalFirstAid) setGeneralFirstAid(session.generalFirstAid);
        if (session.hospitalRanking?.length > 0) setHospitalRanking(session.hospitalRanking);
        if (session.ambulanceId && typeof session.ambulanceId === 'object') {
          setAmbulanceInfo({
            driverName: session.ambulanceId.driverName,
            vehicleNumber: session.ambulanceId.vehicleNumber,
            status: session.ambulanceId.status,
          });
        }
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load session'));
  }, [id, loadSession]);

  // ── Join socket room ────────────────────────────────────────────────────────
  useJoinSession(id);

  // ═══════════════════════════════════════════════════════════════════════════════
  // SOCKET EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════

  useSocketEvent('session_status_changed', useCallback((data) => {
    updateActiveSession({ status: data.newStatus });
    if (data.newStatus === 'CANCELLED') {
      setStatusBanner({ type: 'cancelled', message: 'Emergency Cancelled' });
      setTimeout(() => navigate('/dashboard'), 3000);
    } else if (data.newStatus === 'RESOLVED') {
      setStatusBanner({ type: 'resolved', message: 'Help has arrived!' });
      setTimeout(() => navigate('/dashboard'), 3000);
    }
  }, [updateActiveSession, navigate]), [id]);

  useSocketEvent('ambulance_assigned', useCallback((data) => {
    setAmbulanceInfo(data);
    const eta = data.eta || data.etaMinutes;
    if (eta) {
      setInitialEta(eta);
      setEtaMinutes(eta);
    }
    updateActiveSession({ ambulanceId: data });
  }, [updateActiveSession]), [id]);

  useSocketEvent('driver_location', useCallback((data) => {
    const newPos = { lat: data.latitude, lng: data.longitude };
    setDriverPosition(newPos);
    setDriverDisconnected(false);
  }, []), [id]);

  useSocketEvent('location_update', useCallback((data) => {
    const newPos = { lat: data.latitude, lng: data.longitude };
    setDriverPosition(newPos);
    updateActiveSession({
      ambulanceId: {
        ...activeSession?.ambulanceId,
        currentLocation: { coordinates: [data.longitude, data.latitude] }
      }
    });
  }, [activeSession?.ambulanceId, updateActiveSession]), [id]);

  useSocketEvent('eta_update', useCallback((data) => {
    setEtaMinutes(data.etaMinutes);
    if (!initialEta) setInitialEta(data.etaMinutes);
  }, [initialEta]), [id]);

  useSocketEvent('general_first_aid', useCallback((data) => {
    setGeneralFirstAid(data);
  }, []), [id]);

  useSocketEvent('specialised_first_aid', useCallback((data) => {
    setSpecialisedFirstAid(data);
  }, []), [id]);

  useSocketEvent('hospital_options', useCallback((data) => {
    setHospitalRanking(data.hospitalRanking);
  }, []), [id]);

  useSocketEvent('delay_detected', useCallback((data) => {
    setDelayInfo(data);
    toast.error('Delay detected — ambulance may take longer');
  }, []), [id]);

  useSocketEvent('ai_suggestion', useCallback((data) => {
    setAiSuggestion(data);
  }, []), [id]);

  useSocketEvent('driver_arrived', useCallback(() => {
    setDriverArrived(true);
    toast.success('Driver has arrived!');
  }, []), [id]);

  useSocketEvent('arrival_otp_generated', useCallback((data) => {
    setOtpData(data);
  }, []), [id]);

  useSocketEvent('chat_message', useCallback(() => {
    if (!chatOpen) {
      setUnreadCount(prev => prev + 1);
    }
  }, [chatOpen]), [id]);

  useSocketEvent('driver_disconnected', useCallback(() => {
    setDriverDisconnected(true);
  }, []), [id]);

  // ── Reset unread when chat opens ────────────────────────────────────────────
  const handleToggleChat = () => {
    setChatOpen(prev => !prev);
    if (!chatOpen) setUnreadCount(0);
  };

  // ── ETA progress calculation ────────────────────────────────────────────────
  const etaProgress = initialEta && etaMinutes != null
    ? Math.min(100, Math.max(5, ((initialEta - etaMinutes) / initialEta) * 100))
    : 0;

  // ── Ambulance location for map ──────────────────────────────────────────────
  const ambulanceLoc = driverPosition
    ? driverPosition
    : activeSession?.ambulanceId?.currentLocation?.coordinates
      ? {
          lng: activeSession.ambulanceId.currentLocation.coordinates[0],
          lat: activeSession.ambulanceId.currentLocation.coordinates[1],
        }
      : null;

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER — LOADING / ERROR
  // ═══════════════════════════════════════════════════════════════════════════════

  if (isLoading || !activeSession) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-text-muted">Loading live tracking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  const sevConfig = SEVERITY_CONFIG[activeSession.severityLevel] || SEVERITY_CONFIG[3];
  const emoji = TYPE_EMOJI[activeSession.emergencyType] || '🚨';
  const topHospital = hospitalRanking?.[0] || (activeSession.hospitalId && typeof activeSession.hospitalId === 'object' ? activeSession.hospitalId : null);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER — MAIN
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />

      {/* ── Status Banners ───────────────────────────────────────────────── */}
      {statusBanner && (
        <div className={`px-4 py-3 text-center font-bold text-sm ${
          statusBanner.type === 'cancelled' ? 'bg-slate-700 text-slate-200' : 'bg-green-700 text-green-100'
        }`}>
          {statusBanner.message} — Redirecting to dashboard...
        </div>
      )}
      {driverArrived && !statusBanner && (
        <div className="px-4 py-3 text-center font-bold text-sm bg-green-700 text-green-100">
          ✅ Driver has arrived at your location!
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)]">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LEFT PANEL — scrollable, 35% width                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-[35%] border-r border-border-light overflow-y-auto p-4 space-y-4">

          {/* ── 1. Session Header ──────────────────────────────────────────── */}
          <div className="glass p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{emoji}</span>
              <h2 className="font-bold text-lg text-text-primary">
                {activeSession.emergencyType?.replace(/_/g, ' ')}
              </h2>
              <Badge color={sevConfig.color}>{sevConfig.label}</Badge>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={activeSession.status} />
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started {timeAgo(activeSession.createdAt)}
              </span>
            </div>
            {activeSession.description && (
              <p className="text-sm text-text-muted italic border-t border-border-light pt-2">
                "{activeSession.description}"
              </p>
            )}
          </div>

          {/* ── 2. ETA + Driver Info Card ──────────────────────────────────── */}
          <div className="glass p-4 space-y-3">
            {ambulanceInfo ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚑</span>
                  <h3 className="font-bold text-text-primary">Help is on the way</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  {ambulanceInfo.driverName && (
                    <p className="text-text-muted">
                      <span className="text-text-primary font-medium">Driver:</span> {ambulanceInfo.driverName}
                    </p>
                  )}
                  {ambulanceInfo.vehicleNumber && (
                    <p className="text-text-muted">
                      <span className="text-text-primary font-medium">Vehicle:</span> {ambulanceInfo.vehicleNumber}
                    </p>
                  )}
                  {ambulanceInfo.contactNumber && (
                    <p className="text-text-muted">
                      <span className="text-text-primary font-medium">Contact:</span>{' '}
                      <a href={`tel:${ambulanceInfo.contactNumber}`} className="text-accent-blue hover:underline">
                        {ambulanceInfo.contactNumber}
                      </a>
                    </p>
                  )}
                </div>

                {/* ETA Display */}
                {etaMinutes != null && (
                  <div className="text-center py-2 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold text-text-primary">⏱ {Math.round(etaMinutes)}</span>
                      <span className="text-lg text-text-muted">min</span>
                    </div>
                    <p className="text-xs text-text-muted">estimated arrival</p>
                    <div className="w-full bg-bg-elevated rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${etaProgress}%`,
                          background: 'linear-gradient(90deg, #2563EB, #16A34A)',
                        }}
                      />
                    </div>
                    <p className="text-xs text-text-muted">{Math.round(etaProgress)}% of the way</p>
                  </div>
                )}

                {/* Ambulance status */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-text-muted">Status:</span>
                  <StatusBadge status={activeSession.status} />
                </div>
              </>
            ) : (
              /* Skeleton while waiting for assignment */
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚑</span>
                  <h3 className="font-bold text-text-primary">Assigning ambulance...</h3>
                </div>
                <Skeleton lines={3} />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-400">Finding the nearest available ambulance</span>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. General First Aid Card ──────────────────────────────────── */}
          {generalFirstAid && (
            <div className="glass-green p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg">🩺</span>
                <h3 className="font-bold text-green-300">General First Aid</h3>
                <Badge color="green">General First Aid</Badge>
              </div>
              {generalFirstAid.title && (
                <h4 className="font-semibold text-text-primary text-sm">{generalFirstAid.title}</h4>
              )}
              <ol className="space-y-2 pl-1">
                {generalFirstAid.steps?.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-text-muted">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              {generalFirstAid.warnings?.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-amber-500/20">
                  {generalFirstAid.warnings.map((w, idx) => (
                    <p key={idx} className="text-xs text-amber-400 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 4. Specialised First Aid Card ─────────────────────────────── */}
          {specialisedFirstAid && (
            <div className="glass-purple p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg">🤖</span>
                <h3 className="font-bold text-purple-300">AI Specialised</h3>
                <Badge color="purple">Powered by LLaMA</Badge>
              </div>
              {specialisedFirstAid.title && (
                <h4 className="font-semibold text-text-primary text-sm">{specialisedFirstAid.title}</h4>
              )}
              <ol className="space-y-2 pl-1">
                {specialisedFirstAid.steps?.slice(0, 5).map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-text-muted">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              {specialisedFirstAid.estimatedTimeMin && (
                <div className="flex items-center gap-2 pt-1">
                  <Badge color="purple">
                    <Clock className="w-3 h-3 mr-1" />
                    Est. {specialisedFirstAid.estimatedTimeMin} min
                  </Badge>
                </div>
              )}
              {specialisedFirstAid.warnings?.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-red-500/20">
                  {specialisedFirstAid.warnings.map((w, idx) => (
                    <p key={idx} className="text-xs text-red-400 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 5. Hospital Info Card ─────────────────────────────────────── */}
          {topHospital && (
            <div className="glass p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏥</span>
                <h3 className="font-bold text-text-primary">Taking you to</h3>
              </div>
              <p className="font-semibold text-text-primary">{topHospital.name}</p>
              {topHospital.address && (
                <p className="text-xs text-text-muted">📍 {topHospital.address}</p>
              )}
              {topHospital.distance && (
                <p className="text-xs text-text-muted">{topHospital.distance}</p>
              )}
              {topHospital.speciality && (
                <p className="text-xs text-text-muted">{topHospital.speciality}</p>
              )}
              <Badge color="purple">AI Selected ✨</Badge>
            </div>
          )}

          {/* ── 6. Delay Alert ────────────────────────────────────────────── */}
          {delayInfo && (
            <div className="glass-amber p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-amber-300">Delay Detected</h3>
              </div>
              <p className="text-sm text-text-muted">
                {delayInfo.message || 'The ambulance is taking longer than expected. Hang tight — help is still coming.'}
              </p>
              {delayInfo.newEtaMinutes && (
                <p className="text-sm text-amber-400 font-semibold">
                  New ETA: ~{delayInfo.newEtaMinutes} min
                </p>
              )}
            </div>
          )}

          {/* ── 7. AI Suggestion Card ─────────────────────────────────────── */}
          {aiSuggestion && (
            <div className="glass-blue p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-blue-300">AI Suggestion</h3>
              </div>
              <p className="text-sm text-text-muted">{aiSuggestion.message || aiSuggestion.suggestion}</p>
            </div>
          )}

          {/* ── 8. Driver Disconnected Alert ──────────────────────────────── */}
          {driverDisconnected && (
            <div className="glass p-4 space-y-2 opacity-70">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-300">Driver Signal Lost</h3>
              </div>
              <p className="text-xs text-text-muted">
                Connection to driver temporarily lost. Location updates may be delayed.
              </p>
            </div>
          )}

          {/* ── 9. OTP Display ────────────────────────────────────────────── */}
          {otpData && (
            <div className="glass-blue p-4 space-y-3 text-center">
              <h3 className="font-bold text-blue-300">Arrival OTP</h3>
              <p className="text-4xl font-mono font-bold text-text-primary tracking-[0.3em]">{otpData.otp}</p>
              <p className="text-xs text-text-muted">{otpData.message}</p>
              <p className="text-xs text-amber-400">Expires in {otpData.expiresInMinutes} minutes</p>
            </div>
          )}

          {/* ── 10. Chat Panel — COLLAPSED BY DEFAULT ─────────────────────── */}
          <div className="glass overflow-hidden">
            <button
              onClick={handleToggleChat}
              className="w-full flex items-center justify-between p-4 hover:bg-bg-elevated/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-accent-blue" />
                <span className="font-bold text-text-primary">Chat with Driver</span>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-600 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {chatOpen
                ? <ChevronUp className="w-5 h-5 text-text-muted" />
                : <ChevronDown className="w-5 h-5 text-text-muted" />
              }
            </button>
            {chatOpen && (
              <div className="border-t border-border-light">
                <ChatPanel sessionId={id} />
              </div>
            )}
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RIGHT PANEL — Map, 65% width                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-[65%] bg-bg-card relative">
          <TrackingMap
            patientLoc={activeSession.location}
            ambulanceLoc={ambulanceLoc}
          />

          {/* ETA Overlay Badge — bottom right */}
          {etaMinutes != null && (
            <div className="absolute bottom-6 right-6 glass px-4 py-3 flex items-center gap-3 z-[1000]">
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary">{Math.round(etaMinutes)}</p>
                <p className="text-xs text-text-muted">min ETA</p>
              </div>
              <StatusBadge status={activeSession.status} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
