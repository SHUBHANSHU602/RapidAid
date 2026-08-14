import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { ExternalLink, Navigation, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { getGoogleMapsUrl } from '../../../utils/geo';

export const NavigationCard = ({
  patientLocation,
  sessionId,
  currentStatus = 'ASSIGNED',
  onTransitionStatus,
  onResolveSession,
  distanceKm = 1.8,
}) => {
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const lat = patientLocation?.lat || 25.3176;
  const lng = patientLocation?.lng || 82.9739;
  const mapsUrl = getGoogleMapsUrl(lat, lng);

  const handleConfirmResolve = async () => {
    setIsResolving(true);
    try {
      await onResolveSession(sessionId);
      setShowResolveModal(false);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Card className="border-slate-700/80 bg-[#1E293B]/70 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-red-500" />
          Tactical Route Navigation
        </h4>
        <span className="text-xs font-bold text-amber-400 font-mono">
          {distanceKm ? `${distanceKm.toFixed(1)} km to target` : 'Active Route'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Maps Deep Link */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/60 text-slate-100 font-bold text-xs transition-all shadow-md hover:scale-[1.02]"
        >
          <ExternalLink className="w-4 h-4 text-cyan-400" />
          <span>Launch Google Maps GPS</span>
        </a>

        {/* En Route Trigger */}
        {currentStatus === 'ASSIGNED' && (
          <Button
            variant="primary"
            size="md"
            icon={Navigation}
            onClick={() => onTransitionStatus(sessionId, 'EN_ROUTE')}
            className="w-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-900/40"
          >
            I'm On My Way (En Route)
          </Button>
        )}

        {currentStatus === 'EN_ROUTE' && (
          <div className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-2" />
            En Route to Patient
          </div>
        )}
      </div>

      {/* Mark as Resolved button */}
      <div className="pt-3 border-t border-white/[0.06]">
        <Button
          variant="danger"
          size="lg"
          icon={CheckCircle}
          onClick={() => setShowResolveModal(true)}
          className="w-full font-bold uppercase tracking-wider text-xs py-3.5 shadow-xl shadow-red-950"
        >
          Mark Mission as Resolved
        </Button>
      </div>

      {/* Resolution Confirmation Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Confirm Mission Resolution"
        subtitle="Confirm patient handover or emergency completion."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 flex items-start gap-2.5 text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>
              This will conclude the active dispatch room, stop GPS broadcasting, and update the session status to <strong>RESOLVED</strong>.
            </p>
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowResolveModal(false)}
              className="flex-1 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isResolving}
              onClick={handleConfirmResolve}
              className="flex-1 text-xs font-bold uppercase"
            >
              Confirm Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default NavigationCard;
