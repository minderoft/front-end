// filepath: front-end/src/pages/AnnouncementDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { announcementService } from '../services/api';

const AnnouncementDetail = () => {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await announcementService.getById(id);
        setAnnouncement(response.data.announcement);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncement();
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="announcement-detail text-center">
        <h2>Annonce non trouvée</h2>
        <Link to="/announcements" className="btn btn-primary mt-3">
          Retour aux annonces
        </Link>
      </div>
    );
  }

  const images = announcement.images || [];
  const categoryLabels = {
    immobilier: 'Immobilier',
    vehicule: 'Véhicule',
    materiaux: 'Matériaux de construction',
    technicien: 'Technicien',
  };

  return (
    <div className="announcement-detail">
      <Link to="/announcements" className="btn btn-ghost mb-3">
        ← Retour aux annonces
      </Link>

      {/* Galerie d'images */}
      {images.length > 0 ? (
        <div className="announcement-gallery">
          <img 
            src={images[selectedImage]} 
            alt={announcement.title}
            className="announcement-main-image"
          />
          {images.length > 1 && (
            <div className="announcement-thumbnails">
              {images.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`${announcement.title} - ${index + 1}`}
                  className="announcement-thumbnail"
                  onClick={() => setSelectedImage(index)}
                  style={{ opacity: selectedImage === index ? 1 : 0.7 }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#E2E8F0', 
          height: '300px', 
          borderRadius: 'var(--radius-lg)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '5rem',
          marginBottom: 'var(--spacing-xl)'
        }}>
          🏠
        </div>
      )}

      {/* Informations */}
      <div className="announcement-info">
        <div className="d-flex justify-between align-center mb-3" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ 
            fontSize: '0.875rem', 
            color: 'var(--accent)',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            {categoryLabels[announcement.category]}
          </span>
          
          {announcement.type && (
            <span style={{ 
              fontSize: '0.875rem', 
              backgroundColor: 'var(--primary)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)'
            }}>
              {announcement.type === 'vente' ? 'À vendre' : 'À location'}
            </span>
          )}
        </div>

        <h1 style={{ marginBottom: 'var(--spacing-md)' }}>{announcement.title}</h1>
        
        <div className="announcement-price">
          {announcement.category === 'technicien' || announcement.price === 0 
            ? 'Prix à négocier' 
            : `${announcement.price?.toLocaleString()} FCFA`}
        </div>

        <div className="announcement-meta">
          <span>📍 {announcement.location}</span>
          {announcement.phone && <span>📞 {announcement.phone}</span>}
          <span>📅 Publié le {new Date(announcement.created_at).toLocaleDateString('fr-FR')}</span>
        </div>

        <hr style={{ margin: 'var(--spacing-lg) 0', border: 'none', borderTop: '1px solid var(--border)' }} />

        <h3 className="mb-2">Description</h3>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
          {announcement.description || 'Aucune description fournie.'}
        </p>

        {/* Métadonnées spécifiques selon la catégorie */}
        {announcement.metadata && (
          <>
            <hr style={{ margin: 'var(--spacing-lg) 0', border: 'none', borderTop: '1px solid var(--border)' }} />
            <h3 className="mb-2">Détails</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
              {Object.entries(announcement.metadata).map(([key, value]) => (
                <div key={key}>
                  <strong style={{ color: 'var(--text-light)' }}>{key}:</strong> {value}
                </div>
              ))}
            </div>
          </>
        )}

        <hr style={{ margin: 'var(--spacing-lg) 0', border: 'none', borderTop: '1px solid var(--border)' }} />

        {/* Contact */}
        <div style={{ 
          backgroundColor: 'var(--background)', 
          padding: 'var(--spacing-lg)', 
          borderRadius: 'var(--radius-md)' 
        }}>
          <h3 className="mb-3">Contacter le vendeur</h3>
          
          {announcement.user_name && (
            <p className="mb-2">
              <strong>Nom:</strong> {announcement.user_name}
            </p>
          )}
          
          {announcement.user_phone && (
            <p className="mb-2">
              <strong>Téléphone:</strong> {announcement.user_phone}
            </p>
          )}
          
          {announcement.user_email && (
            <p className="mb-3">
              <strong>Email:</strong> {announcement.user_email}
            </p>
          )}

          <a 
            href={`tel:${announcement.user_phone}`} 
            className="btn btn-accent"
            style={{ width: '100%' }}
          >
            📞 Appeler maintenant
          </a>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetail;