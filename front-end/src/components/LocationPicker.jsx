import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corriger le problème des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Composant pour gérer les événements de clic sur la carte
const MapClickHandler = ({ onPositionChange }) => {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onPositionChange({ lat, lng });
    },
  });
  return null;
};

const LocationPicker = ({ position, onChange }) => {
  const [mapKey, setMapKey] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState(
    position ? [position.lat, position.lng] : [6.8276, -5.2893] // Abidjan par défaut
  );

  const handlePositionChange = (newPosition) => {
    setSelectedPosition([newPosition.lat, newPosition.lng]);
    onChange({ 
      lat: newPosition.lat, 
      lng: newPosition.lng 
    });
  };

  // Re-rendre la carte si la position initiale change
  useEffect(() => {
    if (position) {
      setSelectedPosition([position.lat, position.lng]);
    }
  }, [position?.lat, position?.lng]);

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 'var(--radius-md, 8px)',
        overflow: 'hidden',
        border: '1px solid var(--border, #E2E8F0)',
        marginTop: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <MapContainer
        key={mapKey}
        center={selectedPosition}
        zoom={12}
        style={{ 
          height: '400px', 
          width: '100%',
          borderRadius: 'var(--radius-md, 8px)',
        }}
        className="location-picker-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
          maxZoom={19}
        />
        <MapClickHandler onPositionChange={handlePositionChange} />
        {selectedPosition && (
          <Marker position={selectedPosition}>
            <Popup>
              <div style={{ fontSize: '12px', color: '#333' }}>
                <strong>Position sélectionnée</strong>
                <br />
                Lat: {selectedPosition[0].toFixed(4)}
                <br />
                Lng: {selectedPosition[1].toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <div
        style={{
          backgroundColor: '#F8F9FA',
          padding: '12px',
          fontSize: '12px',
          color: '#666',
          borderTop: '1px solid var(--border, #E2E8F0)',
        }}
      >
        💡 <strong>Cliquez sur la carte</strong> pour placer un marqueur et sélectionner une position
      </div>
    </div>
  );
};

export default LocationPicker;
