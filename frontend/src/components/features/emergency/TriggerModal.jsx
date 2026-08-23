import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import useSessionStore from '../../../store/sessionStore';
import { useGeolocation } from '../../../hooks/useGeolocation';

const EMERGENCY_TYPES = [
  'CARDIAC', 'ACCIDENT', 'STROKE', 'FIRE', 'OTHER',
  'SNAKE_BITE', 'BREATHING', 'HEAD_INJURY', 'BURNS',
  'POISONING', 'PREGNANCY', 'TRAUMA', 'RESPIRATORY', 'NEUROLOGICAL'
];

const SEVERITY_LABELS = {
  1: 'Minor',
  2: 'Low',
  3: 'Moderate',
  4: 'Severe',
  5: 'Critical',
};

export default function TriggerModal({ isOpen, onClose }) {
  const [type, setType] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { location, error: geoError, loading: geoLoading } = useGeolocation();
  const { triggerEmergency } = useSessionStore();
  const navigate = useNavigate();

  const handleTrigger = async () => {
    if (geoLoading) {
      toast.error('Waiting for location...');
      return;
    }
    if (geoError) {
      toast.error('Location is required for emergency dispatch.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const session = await triggerEmergency({
        lat: location.lat,
        lng: location.lng,
        emergencyType: type,
        severityLevel: parseInt(severity),
        description: description
      });
      toast.success('Ambulance dispatched!');
      onClose();
      navigate(`/emergency/${session.sessionId || session._id}`);
    } catch (err) {
      if (err.message === 'ACTIVE_SESSION_EXISTS') {
        toast.error('You already have an active emergency. Cancel it first.');
        onClose();
        return;
      }
      toast.error(err.response?.data?.message || 'Failed to trigger emergency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trigger Emergency">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Emergency Type</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)}
            className="w-full bg-bg-elevated border border-border-light rounded-xl text-text-primary px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-red/50"
          >
            {EMERGENCY_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Severity <span className="text-text-muted/60">(optional — defaults to Moderate)</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSeverity(lvl)}
                className={`
                  flex-1 py-2 rounded-lg font-bold transition-all duration-200 text-sm
                  ${severity === lvl 
                    ? (lvl >= 4 ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : lvl === 3 ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30')
                    : 'bg-bg-elevated text-text-muted hover:bg-bg-card'
                  }
                `}
              >
                {lvl}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">
            {SEVERITY_LABELS[severity]} — {severity >= 4 ? 'Life-threatening' : severity === 3 ? 'Needs prompt attention' : 'Non-critical'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Help our AI provide better first aid..."
            className="w-full h-24 bg-bg-elevated border border-border-light rounded-xl text-text-primary px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-red/50 resize-none"
          />
        </div>

        {geoLoading && <p className="text-sm text-accent-amber">Acquiring GPS location...</p>}
        {geoError && <p className="text-sm text-red-500">Location error: {geoError}. Using default.</p>}

        <Button 
          variant="primary" 
          fullWidth 
          size="lg" 
          onClick={handleTrigger}
          loading={isSubmitting}
          disabled={geoLoading}
          className="bg-red-600 hover:bg-red-700"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          Dispatch Ambulance Now
        </Button>
      </div>
    </Modal>
  );
}
