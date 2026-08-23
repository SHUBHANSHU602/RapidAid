import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const patientIcon = new L.DivIcon({
  html: '<div class="patient-marker"></div>',
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const ambulanceIcon = new L.DivIcon({
  html: '<div class="ambulance-marker">🚑</div>',
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Component to recenter map when positions change
function MapRecenter({ patientLoc, ambulanceLoc }) {
  const map = useMap();
  useEffect(() => {
    if (!patientLoc) return;
    
    if (ambulanceLoc) {
      const bounds = L.latLngBounds(
        [patientLoc.lat, patientLoc.lng],
        [ambulanceLoc.lat, ambulanceLoc.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else {
      map.flyTo([patientLoc.lat, patientLoc.lng], 16, { animate: true });
    }
  }, [map, patientLoc, ambulanceLoc]);
  
  return null;
}

export default function TrackingMap({ patientLoc, ambulanceLoc }) {
  if (!patientLoc) return null;

  return (
    <MapContainer 
      center={[patientLoc.lat, patientLoc.lng]} 
      zoom={14} 
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      <Marker position={[patientLoc.lat, patientLoc.lng]} icon={patientIcon}>
        <Popup>Emergency Location</Popup>
      </Marker>
      
      {ambulanceLoc && (
        <Marker position={[ambulanceLoc.lat, ambulanceLoc.lng]} icon={ambulanceIcon}>
          <Popup>Ambulance</Popup>
        </Marker>
      )}

      <MapRecenter patientLoc={patientLoc} ambulanceLoc={ambulanceLoc} />
    </MapContainer>
  );
}
