import Navbar from '../components/layout/Navbar';
import useDriverStore from '../store/driverStore';
import Button from '../components/ui/Button';
import LocationEmitter from '../components/features/driver/LocationEmitter';

export default function DriverDashboard() {
  const { isOnline, toggleOnline, assignment } = useDriverStore();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />
      <LocationEmitter active={isOnline || !!assignment} />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Driver Dashboard</h1>
        <div className="glass p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Status: {isOnline ? 'Available' : 'Offline'}</h2>
            <p className="text-text-muted">Toggle your availability to receive assignments.</p>
          </div>
          <Button 
            variant={isOnline ? 'danger' : 'success'} 
            onClick={() => toggleOnline('dummy_id')}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
        {assignment ? (
          <div className="glass-red p-6 border-red-500/50 space-y-4">
            <h2 className="text-2xl font-bold text-red-400">Emergency Assigned!</h2>
            <p>Type: {assignment.emergencyType}</p>
            <p>Severity: {assignment.severityLevel}</p>
            <Button fullWidth>View Details & Navigate</Button>
          </div>
        ) : (
          <div className="glass p-12 text-center text-text-muted">
            {isOnline ? 'Waiting for emergencies...' : 'Go online to receive emergencies.'}
          </div>
        )}
      </main>
    </div>
  );
}
