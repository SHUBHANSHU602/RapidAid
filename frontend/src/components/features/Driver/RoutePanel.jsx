import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { Navigation, Route, Car, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoutePanel({ traffic, eta, distance, onReroute }) {
  const getTrafficColor = (t) => {
    switch(t) {
      case 'HEAVY': return 'text-red-400';
      case 'MODERATE': return 'text-amber-400';
      case 'LOW': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <Card className="mb-6 border-border-primary/50">
      <div className="p-4 border-b border-border-primary/30 flex justify-between items-center bg-bg-secondary/20">
        <h3 className="font-bold flex items-center gap-2">
          <Route className="w-5 h-5 text-indigo-400" />
          Navigation & Traffic
        </h3>
      </div>
      
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-text-muted text-sm uppercase tracking-wider mb-1">Distance</p>
            <p className="text-2xl font-bold">{distance} km</p>
          </div>
          <div className="text-right">
            <p className="text-text-muted text-sm uppercase tracking-wider mb-1">Estimated ETA</p>
            <p className="text-2xl font-bold text-blue-400">{eta} min</p>
          </div>
        </div>

        <div className="bg-bg-secondary/40 rounded-lg p-4 flex items-center justify-between border border-border-primary/30">
          <div className="flex items-center gap-3">
            <Car className={`w-5 h-5 ${getTrafficColor(traffic)}`} />
            <div>
              <p className="text-sm font-medium">Current Route Traffic</p>
              <p className={`text-xs font-bold ${getTrafficColor(traffic)}`}>{traffic}</p>
            </div>
          </div>
          
          {traffic === 'HEAVY' && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4" /> Delay Detected
            </div>
          )}
        </div>

        {traffic === 'HEAVY' && (
          <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-red-200">Alternative Route Available</span>
              <span className="text-green-400 font-bold text-sm">ETA: {eta - 5} min</span>
            </div>
            <Button variant="danger" fullWidth onClick={onReroute}>
              Accept Reroute (-5 mins)
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button 
            className="flex items-center justify-center gap-2" 
            variant="primary"
            onClick={() => toast.success("Starting voice navigation (Demo)")}
          >
            <Navigation className="w-4 h-4" /> Start
          </Button>
          <Button 
            variant="outline"
            onClick={() => toast.success("Route recalculated (Demo)")}
          >
            Recalculate
          </Button>
        </div>
      </div>
    </Card>
  );
}
