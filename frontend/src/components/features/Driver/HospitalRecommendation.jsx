import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { Hospital, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { useState } from 'react';
import Modal from '../../ui/Modal';

export default function HospitalRecommendation({ recommendedHospital, alternatives }) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!recommendedHospital) return null;

  return (
    <>
      <Card className="mb-6 border-indigo-500/30">
        <div className="p-4 border-b border-indigo-500/30 bg-indigo-950/10 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            AI Hospital Recommendation
          </h3>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded font-bold">
            Score: {recommendedHospital.score}%
          </span>
        </div>
        
        <div className="p-5">
          <h4 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
            <Hospital className="text-red-400" /> {recommendedHospital.name}
          </h4>
          
          <div className="flex gap-4 text-sm text-text-muted mb-4 pb-4 border-b border-border-primary/30">
            <span>Distance: <strong className="text-text-primary">{recommendedHospital.distance} km</strong></span>
            <span>ETA: <strong className="text-green-400">{recommendedHospital.eta} min</strong></span>
          </div>

          <div className="space-y-2 mb-5">
            <p className="text-xs uppercase tracking-wider text-text-muted mb-2">Why recommended?</p>
            {recommendedHospital.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-indigo-100">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            fullWidth 
            className="flex items-center justify-center gap-2"
            onClick={() => setShowAlternatives(true)}
          >
            View Alternative Options <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Modal 
        isOpen={showAlternatives} 
        onClose={() => setShowAlternatives(false)}
        title="Alternative Hospitals"
      >
        <div className="space-y-4">
          {alternatives?.map((alt, i) => (
            <div key={i} className="p-4 bg-bg-secondary rounded-lg border border-border-primary/50">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-text-primary">{alt.name}</h4>
                <span className="text-xs bg-bg-primary px-2 py-1 rounded text-text-muted">
                  Score: {alt.score}%
                </span>
              </div>
              <div className="flex gap-4 text-sm text-text-muted mb-2">
                <span>{alt.distance} km</span>
                <span>{alt.eta} min</span>
              </div>
              <p className="text-xs text-text-muted italic border-t border-border-primary/30 pt-2 mt-2">
                {alt.reasoning}
              </p>
              <Button size="sm" variant="outline" className="w-full mt-3">Select</Button>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
