import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import TrackingMap from '../components/map/TrackingMap';
import LocationEmitter from '../components/features/Driver/LocationEmitter';
import api from '../services/api';
import { useJoinAsDriver, useSocketEvent } from '../hooks/useSocket';

export default function DriverDashboard() {
  const [ambulance, setAmbulance] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDriverState = useCallback(async () => {
    try {
      const [ambRes, activeRes] = await Promise.all([
        api.get('/ambulances/me'),
        api.get('/ambulances/me/active-session'),
      ]);
      const amb = ambRes.data.data;
      setAmbulance(amb);
      setIsOnline((amb.liveStatus || amb.status) === 'AVAILABLE');
      if (activeRes.data.data) {
        setAssignment(activeRes.data.data);
        setEtaMinutes(activeRes.data.data?.etaMinutes || null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDriverState().catch((err) => {
      setAlert(err.response?.data?.message || 'Unable to load driver profile');
      setLoading(false);
    });
  }, [loadDriverState]);

  useJoinAsDriver(assignment?._id);

  useSocketEvent('driver_assignment', useCallback(async (data) => {
    setAlert(data.swapped ? 'You were assigned as the replacement ambulance.' : 'New emergency assigned to you.');
    try {
      const res = await api.get('/ambulances/me/active-session');
      setAssignment(res.data.data || { _id: data.sessionId, ...data, location: data.patientLocation });
      setEtaMinutes(data.etaMinutes ?? null);
    } catch {
      setAssignment({ _id: data.sessionId, ...data, location: data.patientLocation });
    }
  }, []), []);

  useSocketEvent('eta_update', useCallback((data) => {
    if (data.sessionId === assignment?._id) setEtaMinutes(data.etaMinutes);
  }, [assignment?._id]), [assignment?._id]);

  useSocketEvent('driver_location', useCallback((data) => {
    setDriverPosition({ lat: data.latitude, lng: data.longitude });
  }, []), []);

  useSocketEvent('delay_detected', useCallback((data) => {
    setAlert(data.reason === 'AMBULANCE_STALLED'
      ? `Movement stopped for ${data.stalledSeconds}s. Fallback system activated.`
      : 'ETA drift detected. Fallback system activated.');
  }, []), []);

  useSocketEvent('reroute_suggested', useCallback((data) => {
    setAlert(`Reroute suggested. Latest ETA: ${data.freshEta} min.`);
  }, []), []);

  useSocketEvent('route_updated', useCallback((data) => {
    setEtaMinutes(data.newEta);
    setAlert('A faster route was found. Open navigation to follow it.');
  }, []), []);

  useSocketEvent('assignment_cancelled', useCallback(() => {
    setAlert('This emergency was reassigned to a closer ambulance. You are available again.');
    setAssignment(null);
    setEtaMinutes(null);
    setIsOnline(true);
  }, []), []);

  const toggleOnline = async () => {
    if (!ambulance) return;
    const next = isOnline ? 'OFFLINE' : 'AVAILABLE';
    await api.patch(`/ambulances/${ambulance._id}/status`, { status: next });
    setIsOnline(!isOnline);
  };

  const startTrip = async () => {
    if (!assignment?._id) return;
    const res = await api.post(`/emergency/${assignment._id}/transition`, { status: 'EN_ROUTE' });
    setAssignment(res.data.data);
    setAlert('Trip started. Live location and ETA monitoring are active.');
  };

  const openNavigation = () => {
    const loc = assignment?.location || assignment?.patientLocation;
    if (!loc) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank', 'noopener,noreferrer');
  };

  const patientLoc = assignment?.location || assignment?.patientLocation || null;

  if (loading) {
    return <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">Loading driver console…</div>;
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />
      <LocationEmitter active={isOnline || !!assignment} />

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Driver Command Center</h1>
            <p className="text-text-muted">{ambulance ? `Ambulance ${ambulance._id}` : 'No linked ambulance'}</p>
          </div>
          <Button variant={isOnline ? 'danger' : 'success'} onClick={toggleOnline} disabled={!!assignment}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>

        {alert && (
          <div className="glass p-4 border border-amber-500/40 text-amber-200">
            {alert}
          </div>
        )}

        {!assignment ? (
          <div className="glass p-12 text-center text-text-muted">
            {isOnline ? 'Online — waiting for the dispatch engine to assign an emergency.' : 'Go online to become eligible for assignments.'}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[380px_1fr] gap-4 min-h-[70vh]">
            <section className="glass p-5 space-y-4">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Active Emergency</p>
                <h2 className="text-2xl font-bold text-red-400">{assignment.emergencyType || 'Emergency'}</h2>
                <p className="text-text-muted">Severity {assignment.severityLevel ?? '-'}/5</p>
              </div>

              {assignment.description && (
                <div className="bg-bg-elevated rounded-xl p-3 text-sm">{assignment.description}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-elevated rounded-xl p-4">
                  <p className="text-xs text-text-muted">Status</p>
                  <p className="font-bold">{assignment.status || 'ASSIGNED'}</p>
                </div>
                <div className="bg-bg-elevated rounded-xl p-4">
                  <p className="text-xs text-text-muted">Live ETA</p>
                  <p className="font-bold text-2xl">{etaMinutes != null ? `${Math.round(etaMinutes)} min` : '—'}</p>
                </div>
              </div>

              {(assignment.status === 'ASSIGNED' || !assignment.status) && (
                <Button fullWidth onClick={startTrip}>Accept & Start Trip</Button>
              )}
              <Button fullWidth variant="outline" onClick={openNavigation}>Open Live Navigation</Button>

              <div className="text-xs text-text-muted space-y-1">
                <p>• Your phone GPS is shared while online/assigned.</p>
                <p>• Patient sees your movement in real time.</p>
                <p>• ETA refreshes every 30 seconds.</p>
                <p>• If movement stalls, fallback evaluates reroute then swap.</p>
              </div>
            </section>

            <section className="glass overflow-hidden min-h-[520px]">
              {patientLoc ? (
                <TrackingMap patientLoc={patientLoc} ambulanceLoc={driverPosition} />
              ) : (
                <div className="h-full flex items-center justify-center text-text-muted">Patient location unavailable</div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
