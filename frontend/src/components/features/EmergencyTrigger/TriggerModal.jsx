import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { useSessionStore } from '../../../store/sessionStore';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { Heart, Activity, Wind, Brain, AlertTriangle, MapPin, Send, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const EMERGENCY_TYPES = [
  { id: 'CARDIAC', label: 'Cardiac', icon: Heart, desc: 'Chest pain, arrest, palpitations' },
  { id: 'TRAUMA', label: 'Trauma', icon: Activity, desc: 'Severe bleeding, fractures, injury' },
  { id: 'RESPIRATORY', label: 'Respiratory', icon: Wind, desc: 'Choking, severe asthma, dyspnea' },
  { id: 'STROKE', label: 'Neurological', icon: Brain, desc: 'Stroke, seizure, unconsciousness' },
  { id: 'OTHER', label: 'Other Critical', icon: AlertTriangle, desc: 'Burns, poisoning, acute distress' },
];

const SEVERITY_LEVELS = [
  { level: 1, label: 'Minor', color: 'text-emerald-400', desc: 'Stable, non-urgent' },
  { level: 2, label: 'Mild', color: 'text-blue-400', desc: 'Requires attention soon' },
  { level: 3, label: 'Moderate', color: 'text-amber-400', desc: 'Urgent medical care' },
  { level: 4, label: 'Urgent', color: 'text-orange-400', desc: 'Critical, deteriorating' },
  { level: 5, label: 'Life-Threatening', color: 'text-red-500 font-extrabold', desc: 'Immediate resuscitation' },
];

export const TriggerModal = ({ isOpen, onClose }) => {
  const [emergencyType, setEmergencyType] = useState('CARDIAC');
  const [severityLevel, setSeverityLevel] = useState(4);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { location, isLoading: isGeoLoading, getCurrentLocation } = useGeolocation();
  const { triggerEmergency } = useSessionStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Ensure we have latest coordinates
      const coords = await getCurrentLocation();
      const lat = coords?.lat || location.lat || 25.3176;
      const lng = coords?.lng || location.lng || 82.9739;

      const result = await triggerEmergency({
        lat,
        lng,
        emergencyType,
        severityLevel,
        description,
      });

      if (result.success && result.sessionId) {
        onClose();
        navigate(`/emergency/${result.sessionId}`);
      }
    } catch (err) {
      toast.error('Could not initiate dispatch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSeverity = SEVERITY_LEVELS.find((s) => s.level === severityLevel) || SEVERITY_LEVELS[3];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Emergency Dispatch"
      subtitle="AI Triage will match the fastest available ambulance and notify trauma specialists."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Emergency Type Selector (Pills) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
            1. Select Emergency Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {EMERGENCY_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = emergencyType === type.id;

              return (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setEmergencyType(type.id)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-red-950/70 border-red-500 shadow-md shadow-red-950/40 text-white'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs">{type.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{type.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Severity Slider (1 - 5) */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Severity Assessment
            </label>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 ${selectedSeverity.color}`}>
              Level {severityLevel} · {selectedSeverity.label}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={severityLevel}
            onChange={(e) => setSeverityLevel(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
          />

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Level 1 (Minor)</span>
            <span>Level 3 (Moderate)</span>
            <span className="text-red-400 font-bold">Level 5 (Critical)</span>
          </div>
        </div>

        {/* Description Textarea */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            3. Patient Symptoms / Scene Details (Optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe symptoms, conscious state, or building access notes (helps Groq LLaMA 3 triage)..."
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm placeholder:text-slate-500 resize-none"
          />
        </div>

        {/* Geolocation Readout */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              GPS Target: <span className="font-mono text-slate-100 font-semibold">{location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E</span>
            </span>
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGeoLoading}
            className="text-xs text-red-400 hover:text-red-300 underline font-medium focus:outline-none"
          >
            {isGeoLoading ? 'Acquiring...' : 'Refresh GPS'}
          </button>
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          pulse={true}
          icon={Send}
          className="w-full font-extrabold uppercase tracking-wider text-sm py-4 shadow-xl shadow-red-900/40"
        >
          Send Emergency Alert (Sub-300ms)
        </Button>
      </form>
    </Modal>
  );
};

export default TriggerModal;
