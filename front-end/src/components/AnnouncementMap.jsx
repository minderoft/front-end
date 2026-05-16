import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corriger le problème des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const AnnouncementMap = ({ latitude, longitude, title, location }) => {
  const hasCoordinates = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null && latitude !== '' && longitude !== '';

  if (!hasCoordinates) {
    return (
      <div
        style={{
          width: '100%',
          borderRadius: 'var(--radius-md, 8px)',
          overflow: 'hidden',
          border: '1px solid var(--border, #E2E8F0)',
          marginTop: 'var(--spacing-lg, 24px)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#fff',
        }}
      >
        <h3 style={{
          margin: '0 0 12px 0',
          padding: '16px',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'var(--text, #1A202C)',
        }}>
          📍 Localisation
        </h3>
        <div style={{ padding: '16px', color: '#475569', fontSize: '0.95rem' }}>
          <p style={{ margin: 0 }}>Géolocalisation non disponible pour cette annonce.</p>
          {location && <p style={{ margin: '8px 0 0 0' }}>Adresse renseignée : <strong>{location}</strong></p>}
        </div>
      </div>
    );
  }

  const position = [parseFloat(latitude), parseFloat(longitude)];

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 'var(--radius-md, 8px)',
        overflow: 'hidden',
        border: '1px solid var(--border, #E2E8F0)',
        marginTop: 'var(--spacing-lg, 24px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h3 style={{ 
        margin: '0 0 12px 0', 
        padding: '16px 16px 0 16px',
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'var(--text, #1A202C)',
      }}>
        📍 Localisation
      </h3>
      <MapContainer
        center={position}
        zoom={15}
        style={{ 
          height: '350px', 
          width: '100%',
        }}
        scrollWheelZoom={false}
        dragging={true}
        touchZoom={true}
        className="announcement-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap contributors'
          maxZoom={19}
        />
        <Marker position={position}>
          <Popup>
            <div style={{ 
              fontSize: '13px', 
              color: '#333',
              lineHeight: '1.5',
            }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>
                {title}
              </strong>
              <span style={{ color: '#666' }}>
                📍 {location}
              </span>
              <br />
              <span style={{ fontSize: '11px', color: '#999' }}>
                Lat: {position[0].toFixed(4)} | Lng: {position[1].toFixed(4)}
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <div
        style={{
          backgroundColor: '#F8F9FA',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#666',
          borderTop: '1px solid var(--border, #E2E8F0)',
        }}
      >
        ℹ️ Position du bien: <strong>{location}</strong>
      </div>
    </div>
  );
};

export default AnnouncementMap;
