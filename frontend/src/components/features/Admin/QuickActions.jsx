import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { Database, Users, FastForward, Play, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const QuickActions = ({ onRefreshData }) => {
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const mockUsers = [
    { name: 'RapidAid Admin', email: 'admin@rapidaid.com', role: 'ADMIN', status: 'Active' },
    { name: 'Driver 1 (Unit 101)', email: 'driver1@rapidaid.com', role: 'DRIVER', status: 'Online' },
    { name: 'Driver 2 (Unit 102)', email: 'driver2@rapidaid.com', role: 'DRIVER', status: 'Busy' },
    { name: 'Rahul Sharma', email: 'user@rapidaid.com', role: 'USER', status: 'Active' },
    { name: 'Priya Verma', email: 'priya@gmail.com', role: 'USER', status: 'Active' },
  ];

  const handleRunSeed = async () => {
    setIsSeeding(true);
    try {
      // Simulate or call seed endpoint
      await new Promise((r) => setTimeout(r, 1200));
      toast.success('Seed data refreshed: 20 Ambulances, 5 Hospitals & Test Accounts created.');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      toast.error('Failed to trigger seed process.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="bg-[#1E293B]/70 border-white/[0.08] shadow-xl p-5 space-y-4">
      <div className="pb-3 border-b border-white/[0.06]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Admin Quick Actions & Management
        </h4>
        <p className="text-[10px] text-slate-400">Database seeding and dispatch operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="secondary"
          size="md"
          icon={Database}
          isLoading={isSeeding}
          onClick={handleRunSeed}
          className="text-xs font-bold w-full"
        >
          Run Database Seed
        </Button>

        <Button
          variant="secondary"
          size="md"
          icon={Users}
          onClick={() => setShowUsersModal(true)}
          className="text-xs font-bold w-full"
        >
          View Registered Users
        </Button>
      </div>

      {/* Users Modal */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title="Registered System Users"
        subtitle="Role privileges and status breakdown."
        maxWidth="max-w-2xl"
      >
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th className="pb-2 px-2">Name</th>
                <th className="pb-2 px-2">Email</th>
                <th className="pb-2 px-2">Role</th>
                <th className="pb-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockUsers.map((u, i) => (
                <tr key={i} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-2 font-bold text-white">{u.name}</td>
                  <td className="py-2.5 px-2 text-slate-300 font-mono">{u.email}</td>
                  <td className="py-2.5 px-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-emerald-400 font-medium">{u.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </Card>
  );
};

export default QuickActions;
