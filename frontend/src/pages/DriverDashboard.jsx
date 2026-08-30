import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import TrackingMap from '../components/map/TrackingMap';
import LocationEmitter from '../components/features/Driver/LocationEmitter';
import api from '../services/api';
import { useJoinAsDriver, useSocketEvent } from '../hooks/useSocket';

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

export default function DriverDashboard() {
  const [ambulance, setAmbulance] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);

  const loadDriverState = useCallback(async () => {
    try {
      let amb = null;
      try {
        const ambRes = await api.get('/ambulances/me');
        amb = ambRes.data.data;
        setAmbulance(amb);
        setIsOnline((amb.liveStatus || amb.status) === 'AVAILABLE');
      } catch (err) {
        if (err.response?.status !== 404) throw err;
        setAmbulance(null);
        setIsOnline(false);
      }

      if (amb) {
        try {
          const activeRes = await api.get('/ambulances/me/active-session');
          if (activeRes.data.data) {
            setAssignment(activeRes.data.data);
            setEtaMinutes(activeRes.data.data?.etaMinutes ?? null);
            // BUSY is still on-duty. Do not show an active driver as "offline".
            setIsOnline(true);
          }
        } catch (err) {
          if (err.response?.status !== 404) throw err;
        }
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

  // Socket.io remains the primary assignment path. Polling is only recovery for a
  // reconnect/tab-wake race so the demo cannot get stuck after the server assigned us.
  useEffect(() => {
    if (!isOnline || assignment) return undefined;

    const recoverAssignment = async () => {
      try {
        const activeRes = await api.get('/ambulances/me/active-session');
        if (activeRes.data.data) {
          setAssignment(activeRes.data.data);
          setEtaMinutes(activeRes.data.data?.etaMinutes ?? null);
          setIsOnline(true);
          setAlert('Emergency assignment recovered from the server.');
        }
      } catch {
        // Keep waiting; normal Socket.io delivery remains the primary path.
      }
    };

    const timer = setInterval(recoverAssignment, 5000);
    return () => clearInterval(timer);
  }, [isOnline, assignment]);

  useJoinAsDriver(assignment?._id);

  useSocketEvent('driver_assignment', useCallback(async (data) => {
    setIsOnline(true);
    setAlert(data.swapped ? 'You were assigned as the replacement ambulance.' : 'New emergency assigned to you.');
    try {
      const res = await api.get('/ambulances/me/active-session');
      setAssignment(res.data.data || { _id: data.sessionId, ...data, location: data.patientLocation });
      setEtaMinutes(data.etaMinutes ?? res.data.data?.etaMinutes ?? null);
    } catch {
      setAssignment({ _id: data.sessionId, ...data, location: data.patientLocation });
      setEtaMinutes(data.etaMinutes ?? null);
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
    if (changingStatus || assignment) return;
    setChangingStatus(true);

    try {
      if (isOnline) {
        if (!ambulance) return;
        await api.patch(`/ambulances/${ambulance._id}/status`, { status: 'OFFLINE' });
        setIsOnline(false);
        setAlert('You are offline and will not receive new emergencies.');
        return;
      }

      setAlert('Getting your live GPS location…');
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setDriverPosition({ lat, lng });

      const provisionRes = await api.post('/ambulances/me/provision', { lat, lng });
      const linkedAmbulance = provisionRes.data.data;
      setAmbulance(linkedAmbulance);
      setIsOnline(true);

      try {
        const activeRes = await api.get('/ambulances/me/active-session');
        if (activeRes.data.data) {
          setAssignment(activeRes.data.data);
          setEtaMinutes(activeRes.data.data?.etaMinutes ?? (provisionRes.data.assignment?.etaSeconds
            ? Math.ceil(provisionRes.data.assignment.etaSeconds / 60)
            : null));
          setAlert('You are online. A pending emergency has been assigned to you.');
        } else {
          setAlert('You are online and available for emergency assignments.');
        }
      } catch {
        setAlert(provisionRes.data.message || 'You are online and available for emergency assignments.');
      }
    } catch (err) {
      const geoMessage = err?.code === 1
        ? 'Location permission was denied. Allow location access and click Go Online again.'
        : err?.code === 2
          ? 'Your current location could not be determined.'
          : err?.code === 3
            ? 'Getting your GPS location timed out. Try again.'
            : null;
      setAlert(geoMessage || err.response?.data?.message || err.message || 'Unable to change driver status');
    } finally {
      setChangingStatus(false);
    }
  };

  const startTrip = async () => {
    if (!assignment?._id) return;
    const res = await api.post(`/emergency/${assignment._id}/transition`, { status: 'EN_ROUTE' });
    setAssignment(res.data.data);
    setIsOnline(true);
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
            <p className="text-text-muted">
              {ambulance ? `Ambulance ${ambulance._id}` : 'No linked ambulance yet — Go Online will create/link one using your current GPS'}
            </p>
          </div>
          <Button
            variant={assignment ? 'success' : isOnline ? 'danger' : 'success'}
            onClick={toggleOnline}
            disabled={!!assignment || changingStatus}
          >
            {assignment ? 'On Duty' : changingStatus ? 'Please wait…' : isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>

        {alert && (
          <div className="glass p-4 border border-amber-500/40 text-amber-200">
            {alert}
          </div>
        )}

        {!assignment ? (
          <div className="glass p-12 text-center text-text-muted">
            {isOnline
              ? 'Online — waiting for the dispatch engine to assign an emergency.'
              : 'Click Go Online. RapidAid will use your current GPS and make this driver eligible for assignments.'}
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
