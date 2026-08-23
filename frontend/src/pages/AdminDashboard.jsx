import Navbar from '../components/layout/Navbar';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-6 text-center">
            <h3 className="text-text-muted text-sm uppercase">Active Emergencies</h3>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>
          <div className="glass p-6 text-center">
            <h3 className="text-text-muted text-sm uppercase">Available Ambulances</h3>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>
          <div className="glass p-6 text-center">
            <h3 className="text-text-muted text-sm uppercase">Avg Assignment Time</h3>
            <p className="text-4xl font-bold mt-2">0ms</p>
          </div>
        </div>
        <div className="glass p-12 text-center text-text-muted mt-8">
          Full admin dashboard pending implementation...
        </div>
      </main>
    </div>
  );
}
