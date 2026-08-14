import React, { useState } from 'react';
import Card from '../../ui/Card';
import StatusBadge from '../../ui/StatusBadge';
import { SeverityBadge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { Eye, ChevronDown, Filter, Search, RefreshCw, Radio } from 'lucide-react';
import { formatTimestamp, formatRelativeTime } from '../../../utils/time';

const STATUS_FILTERS = ['ALL', 'INITIATED', 'ASSIGNED', 'EN_ROUTE', 'DELAYED', 'RESOLVED'];

export const SessionsTable = ({
  sessions = [],
  onTransitionStatus,
  isLoading = false,
  onRefresh,
}) => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const filteredSessions = sessions.filter((session) => {
    const matchesFilter = activeFilter === 'ALL' || session.status === activeFilter;
    const searchLower = searchTerm.toLowerCase();
    const sessionId = (session._id || session.id || '').toLowerCase();
    const patientName = (session.userId?.name || session.userId?.email || 'Citizen').toLowerCase();
    const matchesSearch = sessionId.includes(searchLower) || patientName.includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const availableStatuses = ['INITIATED', 'ASSIGNED', 'EN_ROUTE', 'DELAYED', 'RESOLVED', 'CANCELLED'];

  return (
    <Card className="bg-[#1E293B]/70 border-white/[0.08] shadow-2xl p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            Live Emergency Dispatches ({filteredSessions.length})
          </h3>
          <p className="text-xs text-slate-400">Real-time incident queue with autonomous assignment</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500 w-40 sm:w-48"
            />
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pill Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] transition-all shrink-0 ${
              activeFilter === status
                ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <th className="pb-3 px-3">Session ID</th>
              <th className="pb-3 px-3">Patient / Created</th>
              <th className="pb-3 px-3">Category</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3">ETA</th>
              <th className="pb-3 px-3">Unit</th>
              <th className="pb-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                  No emergency sessions matching active filter.
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => {
                const sId = session._id || session.id;
                const patientName = session.userId?.name || session.userId?.email || 'Citizen';
                const vehicle = session.ambulanceId?.vehicleNumber || 'Auto-Assigning';
                const isDropdownOpen = openDropdownId === sId;

                return (
                  <tr key={sId} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Session ID */}
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-200">
                      #{sId?.slice(-6) || '88921'}
                    </td>

                    {/* Patient & Time */}
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-slate-100">{patientName}</p>
                      <p className="text-[10px] text-slate-400">{formatRelativeTime(session.createdAt || new Date())}</p>
                    </td>

                    {/* Type & Severity */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200">{session.emergencyType || 'CARDIAC'}</span>
                        {session.severityLevel && <SeverityBadge level={session.severityLevel} size="sm" />}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <StatusBadge status={session.status} size="sm" />
                    </td>

                    {/* ETA */}
                    <td className="py-3.5 px-3 font-bold text-amber-400">
                      {session.etaMinutes ? `${session.etaMinutes} min` : '4-6 min'}
                    </td>

                    {/* Ambulance Unit */}
                    <td className="py-3.5 px-3 text-slate-300 font-medium truncate max-w-[120px]">
                      {vehicle}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        {/* View in new window */}
                        <a
                          href={`/emergency/${sId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Open tracking telemetry"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>

                        {/* Transition Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(isDropdownOpen ? null : sId)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold"
                          >
                            <span>Status</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {isDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-40">
                                {availableStatuses.map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => {
                                      onTransitionStatus(sId, st);
                                      setOpenDropdownId(null);
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                                      session.status === st
                                        ? 'bg-red-950 text-red-300'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default SessionsTable;
