import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { RefreshCcw, Truck, Clock } from 'lucide-react';
import { useState } from 'react';
import Modal from '../../ui/Modal';
import toast from 'react-hot-toast';

export default function AmbulanceSwapCard({ currentAmbulance, alternateAmbulance, onSwap }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!currentAmbulance || !alternateAmbulance) return null;

  const timeSaved = currentAmbulance.eta - alternateAmbulance.eta;

  const handleSwap = () => {
    setIsModalOpen(false);
    toast.success('Ambulance swapped successfully');
    onSwap(alternateAmbulance);
  };

  return (
    <>
      <Card className="mb-6 border-border-primary/50">
        <div className="p-4 border-b border-border-primary/30 flex justify-between items-center bg-bg-secondary/20">
          <h3 className="font-bold flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-blue-400" />
            Ambulance Management
          </h3>
        </div>
        
        <div className="p-5">
          <p className="text-sm text-text-muted mb-4">
            Another nearby ambulance may reach the patient faster due to traffic conditions.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-bg-secondary/40 rounded-lg border border-border-primary/30">
              <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Current</p>
              <p className="font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" /> {currentAmbulance.id}
              </p>
              <p className="text-sm mt-1 text-red-400">ETA: {currentAmbulance.eta} min</p>
            </div>
            
            <div className="p-3 bg-blue-950/20 rounded-lg border border-blue-500/30">
              <p className="text-xs uppercase tracking-wider text-text-muted mb-1 text-blue-300">Alternative</p>
              <p className="font-bold flex items-center gap-2 text-blue-100">
                <Truck className="w-4 h-4 text-blue-400" /> {alternateAmbulance.id}
              </p>
              <p className="text-sm mt-1 text-green-400">ETA: {alternateAmbulance.eta} min</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            fullWidth 
            onClick={() => setIsModalOpen(true)}
            className="border-blue-500/50 hover:bg-blue-500/10 text-blue-300"
          >
            Swap Ambulance (Save {timeSaved} mins)
          </Button>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Confirm Ambulance Swap"
      >
        <div className="space-y-4">
          <p className="text-text-primary">Are you sure you want to transfer this emergency to another ambulance?</p>
          
          <div className="bg-bg-secondary/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between border-b border-border-primary/30 pb-2">
              <span className="text-text-muted">Current: {currentAmbulance.id}</span>
              <span className="text-red-400">{currentAmbulance.eta} min</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-bold">Replacement: {alternateAmbulance.id}</span>
              <span className="text-green-400 font-bold">{alternateAmbulance.eta} min</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSwap}>Confirm Swap</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
