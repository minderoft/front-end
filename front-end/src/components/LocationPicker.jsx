import { useEffect, useRef, useState } from 'react';

const LocationPicker = ({ position, onChange }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!window.L) {
      const link = document.createElement('link');
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => {
        setIsLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    const L = window.L;
    const map = L.map(mapRef.current).setView([6.8276, -5.2893], 12); // Abidjan par défaut

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Si une position initiale est fournie, ajouter un marqueur
    if (position) {
      const marker = L.marker([position[0], position[1]], { draggable: true })
        .addTo(map);
      marker.on('drag', () => {
        const latlng = marker.getLatLng();
        onChange({ lat: latlng.lat, lng: latlng.lng });
      });
      markerRef.current = marker;
      map.setView([position[0], position[1]], 15);
    }

    // Ajouter un listener pour les clics sur la carte
    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;

      // Supprimer le marqueur précédent
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Créer un nouveau marqueur draggable
      const marker = L.marker([lat, lng], { draggable: true })
        .addTo(mapInstanceRef.current);
      
      marker.on('drag', () => {
        const latlng = marker.getLatLng();
        onChange({ lat: latlng.lat, lng: latlng.lng });
      });

      markerRef.current = marker;
      onChange({ lat, lng });
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isLoaded, onChange]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        marginTop: '8px',
      }}
    />
  );
};

export default LocationPicker;
