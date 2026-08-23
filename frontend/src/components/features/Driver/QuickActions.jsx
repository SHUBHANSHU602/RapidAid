import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { MessageSquare, Navigation, Share2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuickActions() {
  const handleAction = (name) => {
    toast.success(`${name} feature activated (Demo)`);
  };

  return (
    <Card className="mb-6 border-border-primary/50">
      <div className="p-4 border-b border-border-primary/30">
        <h3 className="font-bold">Quick Actions</h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <Button variant="outline" className="flex flex-col items-center justify-center py-4 h-auto gap-2 text-sm" onClick={() => handleAction('Contact Dispatch')}>
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <span>Dispatch</span>
        </Button>
        <Button variant="outline" className="flex flex-col items-center justify-center py-4 h-auto gap-2 text-sm" onClick={() => handleAction('Navigation Mode')}>
          <Navigation className="w-5 h-5 text-indigo-400" />
          <span>Navigate</span>
        </Button>
        <Button variant="outline" className="flex flex-col items-center justify-center py-4 h-auto gap-2 text-sm" onClick={() => handleAction('Share ETA')}>
          <Share2 className="w-5 h-5 text-green-400" />
          <span>Share ETA</span>
        </Button>
        <Button variant="outline" className="flex flex-col items-center justify-center py-4 h-auto gap-2 text-sm" onClick={() => handleAction('Emergency Details')}>
          <Info className="w-5 h-5 text-amber-400" />
          <span>Details</span>
        </Button>
      </div>
    </Card>
  );
}
