import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_COORDINATES } from '../../utils/geo';
import { formatRelativeTime } from '../../utils/time';
import StatusBadge from '../ui/StatusBadge';

// Dynamic Fleet Icon generator based on status
const createFleetIcon = (status = 'AVAILABLE') => {
  const color =
    status === 'AVAILABLE' ? '#16A34A' :
    status === 'BUSY' || status === 'ASSIGNED' || status === 'EN_ROUTE' ? '#DC2626' :
    '#64748B'; // OFFLINE

  return L.divIcon({
    className: 'custom-fleet-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -2px; border-radius: 50%; background: ${color}40; animation: ${status === 'BUSY' ? 'ping 2s infinite' : 'none'};"></div>
        <div style="width: 26px; height: 26px; border-radius: 8px; background: ${color}; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export const FleetMap = ({ ambulances = [] }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-96 bg-[#0B1120] rounded-2xl flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Rendering fleet grid...</span>
        </div>
      </div>
    );
  }

  const center = ambulances[0]?.currentLocation
    ? [ambulances[0].currentLocation.lat, ambulances[0].currentLocation.lng]
    : [DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lng];

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full dark-tiles"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {ambulances.map((amb) => {
          const lat = amb.currentLocation?.lat || amb.location?.lat;
          const lng = amb.currentLocation?.lng || amb.location?.lng;
          if (!lat || !lng) return null;

          return (
            <Marker
              key={amb._id || amb.id}
              position={[lat, lng]}
              icon={createFleetIcon(amb.status)}
            >
              <Popup>
                <div className="p-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-white text-sm">{amb.vehicleNumber || `Unit #${amb._id?.slice(-4)}`}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      amb.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300' :
                      amb.status === 'BUSY' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {amb.status}
                    </span>
                  </div>
                  <p className="text-slate-300">Driver: <span className="text-white font-medium">{amb.driverName || amb.driverId?.name || 'Assigned Officer'}</span></p>
                  <p className="text-slate-400 text-[11px]">Last Ping: {formatRelativeTime(amb.lastPing || new Date())}</p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Fleet Map Legend */}
      <div className="absolute bottom-4 right-4 z-20 bg-[#1E293B]/85 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-4 text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Busy / En Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-500" />
          <span>Offline</span>
        </div>
      </div>
    </div>
  );
};

export default FleetMap;
