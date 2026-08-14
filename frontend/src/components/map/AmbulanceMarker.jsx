import React, { useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { interpolateCoords, calculateBearing } from '../../utils/geo';

// Create custom animated SVG Ambulance Icon
const createAmbulanceIcon = (bearing = 0, isBusy = true) => {
  return L.divIcon({
    className: 'custom-ambulance-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 50%; background: ${isBusy ? 'rgba(220, 38, 38, 0.3)' : 'rgba(22, 163, 74, 0.3)'}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 12px; background: ${isBusy ? '#DC2626' : '#16A34A'}; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transform: rotate(${bearing}deg); transition: transform 0.4s ease;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
            <path d="M8 8v4"/>
            <path d="M6 10h4"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
};

export const AmbulanceMarker = ({ targetPosition, driverName, vehicleNumber, isBusy = true }) => {
  const [currentPosition, setCurrentPosition] = useState(targetPosition);
  const [bearing, setBearing] = useState(0);
  const animationRef = useRef(null);
  const prevPosRef = useRef(targetPosition);

  useEffect(() => {
    if (!targetPosition?.lat || !targetPosition?.lng) return;

    // Calculate rotation angle
    if (prevPosRef.current) {
      const b = calculateBearing(
        prevPosRef.current.lat,
        prevPosRef.current.lng,
        targetPosition.lat,
        targetPosition.lng
      );
      if (b !== 0) setBearing(b);
    }

    const startPos = { ...(prevPosRef.current || targetPosition) };
    const endPos = { ...targetPosition };
    const duration = 2000; // 2s smooth interpolation
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const nextPos = interpolateCoords(startPos, endPos, ease);
      setCurrentPosition(nextPos);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevPosRef.current = endPos;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetPosition?.lat, targetPosition?.lng]);

  if (!currentPosition?.lat || !currentPosition?.lng) return null;

  return (
    <Marker
      position={[currentPosition.lat, currentPosition.lng]}
      icon={createAmbulanceIcon(bearing, isBusy)}
    >
      <Popup>
        <div className="text-xs space-y-1 p-1">
          <p className="font-bold text-sm text-red-400 flex items-center gap-1">
            🚑 {vehicleNumber || 'RapidAid Unit'}
          </p>
          <p className="text-slate-300">Driver: <span className="font-semibold text-white">{driverName || 'En Route Officer'}</span></p>
          <p className="text-slate-400 font-mono text-[10px]">
            {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default AmbulanceMarker;
