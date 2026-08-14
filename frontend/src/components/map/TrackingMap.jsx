import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import AmbulanceMarker from './AmbulanceMarker';
import { haversineDistance, DEFAULT_COORDINATES } from '../../utils/geo';
import { Crosshair, Navigation, MapPin } from 'lucide-react';

// Create patient pulsing pin icon
const createPatientIcon = () => {
  return L.divIcon({
    className: 'custom-patient-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(220, 38, 38, 0.6); animation: pulse 2s infinite;"></div>
        <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #DC2626; border: 3px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(220, 38, 38, 0.9);">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #FFFFFF;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Map Auto-Bounds Controller
const MapBoundsController = ({ patientPos, ambulancePos, shouldRecenter, onRecentered }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points = [];
    if (patientPos?.lat && patientPos?.lng) points.push([patientPos.lat, patientPos.lng]);
    if (ambulancePos?.lat && ambulancePos?.lng) points.push([ambulancePos.lat, ambulancePos.lng]);

    if (points.length === 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, patientPos?.lat, patientPos?.lng, shouldRecenter]);

  return null;
};

export const TrackingMap = ({
  patientLocation,
  ambulanceLocation,
  driverName = 'Officer',
  vehicleNumber = 'RapidAid Unit',
  status = 'EN_ROUTE',
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const patientPos = patientLocation?.lat && patientLocation?.lng
    ? { lat: Number(patientLocation.lat), lng: Number(patientLocation.lng) }
    : DEFAULT_COORDINATES;

  const ambulancePos = ambulanceLocation?.latitude && ambulanceLocation?.longitude
    ? { lat: Number(ambulanceLocation.latitude), lng: Number(ambulanceLocation.longitude) }
    : ambulanceLocation?.lat && ambulanceLocation?.lng
    ? { lat: Number(ambulanceLocation.lat), lng: Number(ambulanceLocation.lng) }
    : null;

  const distanceKm = ambulancePos
    ? haversineDistance(patientPos.lat, patientPos.lng, ambulancePos.lat, ambulancePos.lng)
    : null;

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-[#0B1120] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading satellite map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
      <MapContainer
        center={[patientPos.lat, patientPos.lng]}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full dark-tiles"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Patient Location Marker */}
        <Marker position={[patientPos.lat, patientPos.lng]} icon={createPatientIcon()}>
          <Popup>
            <div className="p-1">
              <p className="font-bold text-red-400 flex items-center gap-1">📍 Patient Location</p>
              <p className="text-xs text-slate-300">Emergency Dispatch Target</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {patientPos.lat.toFixed(5)}, {patientPos.lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Ambulance Marker */}
        {ambulancePos && (
          <AmbulanceMarker
            targetPosition={ambulancePos}
            driverName={driverName}
            vehicleNumber={vehicleNumber}
            isBusy={status !== 'RESOLVED'}
          />
        )}

        {/* Route Connecting Line */}
        {ambulancePos && (
          <Polyline
            positions={[
              [ambulancePos.lat, ambulancePos.lng],
              [patientPos.lat, patientPos.lng],
            ]}
            pathOptions={{
              color: '#DC2626',
              weight: 3.5,
              opacity: 0.8,
              dashArray: '8, 8',
              lineCap: 'round',
            }}
          />
        )}

        <MapBoundsController
          patientPos={patientPos}
          ambulancePos={ambulancePos}
          shouldRecenter={recenterCount}
        />
      </MapContainer>

      {/* Floating Distance Badge (Top-Left) */}
      {distanceKm !== null && (
        <div className="absolute top-4 left-4 z-20 bg-[#1E293B]/85 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Distance to Patient</p>
            <p className="text-sm font-extrabold text-white">
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} meters` : `${distanceKm.toFixed(2)} km`}
            </p>
          </div>
        </div>
      )}

      {/* Floating Map Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setRecenterCount((c) => c + 1)}
          className="p-2.5 rounded-xl bg-[#1E293B]/85 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700/80 shadow-xl transition-all"
          title="Fit view to all markers"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Live Map Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-[11px] text-slate-300 shadow-xl flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_#dc2626]" />
          <span>Patient</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Ambulance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-red-500" />
          <span>Live Vector</span>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
