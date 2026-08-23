import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { Phone, User, Stethoscope, FileText, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import Modal from '../../ui/Modal';

export default function PatientInfoCard({ patient }) {
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);

  if (!patient) return null;

  return (
    <>
      <Card className="mb-6 border-border-primary/50">
        <div className="p-4 border-b border-border-primary/30 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            Patient Information
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-900/30 rounded-full">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Name & Age</p>
              <p className="font-semibold">{patient.name}, {patient.age} years old</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-900/30 rounded-full">
              <Stethoscope className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Reported Condition</p>
              <p className="font-medium text-red-200">{patient.condition}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-900/30 rounded-full">
              <Phone className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Contact Number</p>
              <p className="font-semibold">{patient.phone}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-900/30 rounded-full">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Notes</p>
              <p className="text-sm italic">{patient.notes}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-bg-secondary/30 border-t border-border-primary/30 flex gap-3">
          <Button 
            className="flex-1 flex items-center justify-center gap-2" 
            variant="success"
            onClick={() => window.location.href = `tel:${patient.phone}`}
          >
            <Phone className="w-4 h-4" /> Call Patient
          </Button>
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={() => setDetailsModalOpen(true)}
          >
            View Details
          </Button>
        </div>
      </Card>

      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)}
        title="Full Patient Details"
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm text-text-muted uppercase tracking-wider mb-1">Medical History</h4>
            <p>No known allergies. Previous history of mild hypertension.</p>
          </div>
          <div>
            <h4 className="text-sm text-text-muted uppercase tracking-wider mb-1">Current Vitals (Reported)</h4>
            <p>Unknown, patient is conscious but in pain.</p>
          </div>
          <div>
            <h4 className="text-sm text-text-muted uppercase tracking-wider mb-1">Location Context</h4>
            <p>Near the main intersection, outside the pharmacy.</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
