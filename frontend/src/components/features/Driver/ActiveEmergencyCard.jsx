import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import { Clock, AlertTriangle } from 'lucide-react';

export default function ActiveEmergencyCard({ emergency }) {
  if (!emergency) return null;

  return (
    <Card className="border-red-500/30 bg-red-950/10 shadow-lg shadow-red-900/10 mb-6">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-400 font-bold tracking-wider text-sm uppercase">Active Emergency</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary uppercase">{emergency.type}</h2>
          </div>
          <Badge variant={emergency.priority === 'CRITICAL' ? 'danger' : 'warning'} className="text-sm px-3 py-1">
            {emergency.priority}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-bg-secondary/50 p-4 rounded-lg border border-border-primary/50">
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Patient</p>
            <p className="font-semibold">{emergency.patient.name} ({emergency.patient.age}y)</p>
          </div>
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Contact</p>
            <p className="font-semibold">{emergency.patient.phone}</p>
          </div>
          <div className="col-span-2">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Condition / Notes</p>
            <p className="font-medium text-amber-100">{emergency.patient.condition}</p>
            <p className="text-text-muted mt-1 italic">{emergency.patient.notes}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted mt-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Assigned: {new Date(emergency.timestamp || Date.now()).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span>Awaiting Response</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
