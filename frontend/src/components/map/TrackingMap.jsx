import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const patientIcon = new L.DivIcon({
  html: '<div class="patient-marker" style="background-color:#ef4444;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(239,68,68,.5);"></div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const ambulanceIcon = new L.DivIcon({
  html: '<div class="ambulance-marker" style="font-size:24px;filter:drop-shadow(0 0 5px rgba(0,0,0,.5));">🚑</div>',
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const hospitalIcon = new L.DivIcon({
  html: '<div class="hospital-marker" style="font-size:24px;filter:drop-shadow(0 0 5px rgba(0,0,0,.5));">🏥</div>',
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function MapRecenter({ patientLoc, ambulanceLoc, hospitalLoc }) {
  const map = useMap();

  useEffect(() => {
    if (!patientLoc) return;

    const points = [[patientLoc.lat, patientLoc.lng]];
    if (ambulanceLoc) points.push([ambulanceLoc.lat, ambulanceLoc.lng]);
    if (hospitalLoc) points.push([hospitalLoc.lat, hospitalLoc.lng]);

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], animate: true });
    } else {
      map.flyTo(points[0], 16, { animate: true });
    }
  }, [map, patientLoc, ambulanceLoc, hospitalLoc]);

  return null;
}

export default function TrackingMap({ patientLoc, ambulanceLoc, hospitalLoc, routeCoordinates }) {
  if (!patientLoc) return null;

  return (
    <MapContainer
      center={[patientLoc.lat, patientLoc.lng]}
      zoom={14}
      style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '0.5rem' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {routeCoordinates?.length > 0 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{ color: '#60a5fa', weight: 5, opacity: 0.8, dashArray: '10, 10' }}
        />
      )}

      <Marker position={[patientLoc.lat, patientLoc.lng]} icon={patientIcon}>
        <Popup>Emergency Location</Popup>
      </Marker>

      {ambulanceLoc && (
        <Marker position={[ambulanceLoc.lat, ambulanceLoc.lng]} icon={ambulanceIcon}>
          <Popup>Ambulance</Popup>
        </Marker>
      )}

      {hospitalLoc && (
        <Marker position={[hospitalLoc.lat, hospitalLoc.lng]} icon={hospitalIcon}>
          <Popup>Hospital</Popup>
        </Marker>
      )}

      <MapRecenter patientLoc={patientLoc} ambulanceLoc={ambulanceLoc} hospitalLoc={hospitalLoc} />
    </MapContainer>
  );
}
