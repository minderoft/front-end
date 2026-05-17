// filepath: front-end/src/pages/AnnouncementDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { announcementService, paymentService, reportService, favoriteService } from '../services/api';
import AnnouncementMap from '../components/AnnouncementMap';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';

const AnnouncementDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);

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

  useEffect(() => {
    const fetchFavorite = async () => {
      if (!user || !announcement?.id) return;
      try {
        const response = await favoriteService.getAll();
        const favoriteIds = Array.isArray(response.data.favorites) ? response.data.favorites.map((item) => item.announcement_id) : [];
        setIsFavorite(favoriteIds.includes(announcement.id));
      } catch (error) {
        console.error('Erreur chargement favoris:', error);
      }
    };

    fetchFavorite();
  }, [user, announcement]);

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

  const images = parseImages(announcement.images);
  const allImages = announcement.image_url ? [announcement.image_url, ...images.filter(i => i !== announcement.image_url)] : images;
  const safeIndex = Math.max(0, Math.min(selectedImage, allImages.length - 1));
  const selectedImageUrl = resolveImageUrl(allImages[safeIndex]);

  if (import.meta.env.DEV) {
    console.log('DEBUG AnnouncementDetail images', {
      announcementId: announcement.id,
      rawImages: announcement.images,
      parsedImages: images,
      selectedImageUrl,
    });
  }

  const categoryLabels = {
    immobilier: 'Immobilier',
    vehicule: 'Véhicule',
    materiaux: 'Matériaux de construction',
    technicien: 'Technicien',
  };

  const detailsData = announcement.metadata ?? announcement.details;
  let detailsObj = null;
  try {
    detailsObj = typeof detailsData === 'string' ? JSON.parse(detailsData) : detailsData;
  } catch (error) {
    console.error('Erreur parsing details/metadata:', error, detailsData);
    detailsObj = null;
  }

  const detailsEntries = detailsObj && typeof detailsObj === 'object'
    ? Object.entries(detailsObj)
    : [];

  const sellerPhone = announcement.user_phone || announcement.phone || announcement.phone_number || announcement.user_phone_number;
  const sellerEmail = announcement.user_email || announcement.email;
  const isBoosted = announcement.is_boosted ?? announcement.statut_boost ?? false;
  const announcementLocation = announcement.location || announcement.geolocalisation || '';
  const announcementLatitude = announcement.latitude ?? announcement.geolocalisation?.latitude ?? announcement.geolocalisation?.lat ?? null;
  const announcementLongitude = announcement.longitude ?? announcement.geolocalisation?.longitude ?? announcement.geolocalisation?.lng ?? null;

  const handleToggleFavorite = async () => {
    if (!user) {
      return window.alert('Veuillez vous connecter pour gérer vos favoris.');
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.remove(announcement.id);
        setIsFavorite(false);
      } else {
        await favoriteService.add(announcement.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Erreur favoris:', error);
      window.alert(error.response?.data?.error || 'Impossible de mettre à jour les favoris.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReport = async () => {
    if (!user) {
      return window.alert('Veuillez vous connecter pour signaler une annonce.');
    }

    const reason = window.prompt('Indiquez la raison du signalement (ex: annonce frauduleuse, contenu inapproprié)');
    if (!reason || !reason.trim()) {
      return;
    }

    setReportLoading(true);
    try {
      await reportService.create({ announcementId: announcement.id, reason: reason.trim() });
      window.alert('Votre signalement a été envoyé.');
    } catch (error) {
      console.error('Erreur signalement:', error);
      window.alert(error.response?.data?.error || 'Impossible d\'envoyer le signalement.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleBoost = async () => {
    if (!user || user.id !== announcement.user_id) {
      return window.alert('Seul le propriétaire peut booster cette annonce.');
    }

    if (!window.confirm('Booster cette annonce pour 1000 FCFA pendant 24h ?')) {
      return;
    }

    setBoostLoading(true);
    try {
      const response = await paymentService.create({
        announcementId: announcement.id,
        amount: 1000,
        method: 'mobile_money',
        purpose: 'boost',
      });

      if (response.data.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        window.alert('Erreur lors de la création du paiement de boost.');
      }
    } catch (error) {
      console.error('Erreur boost:', error);
      window.alert(error.response?.data?.error || 'Impossible de lancer le boost.');
    } finally {
      setBoostLoading(false);
    }
  };

  return (
    <div className="announcement-detail">
      <Link to="/announcements" className="btn btn-ghost mb-3">
        ← Retour aux annonces
      </Link>

      {/* Galerie d'images - Améliorée */}
      {images.length > 0 ? (
        <div className="announcement-gallery">
          {/* Image principale */}
          <div>
            {selectedImageUrl ? (
              <img
                src={selectedImageUrl}
                alt={announcement.title}
                className="announcement-main-image"
                loading="lazy"
                onError={handleImageError}
              />
            ) : (
              <div
                className="announcement-main-image"
                style={{
                  backgroundColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '5rem',
                  color: '#CBD5E0'
                }}
              >
                🏠
              </div>
            )}
          </div>

          {/* Miniatures - Visible seulement s'il y a plusieurs images */}
          {images && Array.isArray(images) && images.length > 1 && (
            <div className="announcement-thumbnails">
              {images.map((img, index) => {
                const thumbUrl = resolveImageUrl(img);
                return (
                  <img
                    key={index}
                    src={thumbUrl}
                    alt={`${announcement.title} - ${index + 1}`}
                    className={`announcement-thumbnail ${selectedImage === index ? 'active' : ''}`}
                    loading="lazy"
                    onClick={() => setSelectedImage(index)}
                    onError={(e) => {
                      e.target.style.backgroundColor = '#E2E8F0';
                      e.target.style.display = 'flex';
                      e.target.style.alignItems = 'center';
                      e.target.style.justifyContent = 'center';
                      e.target.textContent = '🏠';
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#E2E8F0', 
          height: '400px', 
          borderRadius: 'var(--radius-lg)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '5rem',
          marginBottom: 'var(--spacing-2xl)',
          color: '#CBD5E0'
        }}>
          🏠
        </div>
      )}

      {/* Carte de géolocalisation */}
      <AnnouncementMap 
        latitude={announcementLatitude}
        longitude={announcementLongitude}
        title={announcement.title}
        location={announcementLocation}
      />

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

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: 'var(--spacing-md)' }}>
          <h1 style={{ margin: 0, flex: 1 }}>{announcement.title}</h1>
          <button
            className="btn btn-ghost"
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            style={{ minWidth: '120px' }}
          >
            {isFavorite ? '♥ Favori' : '♡ Favoris'}
          </button>
        </div>

        {isBoosted && announcement.boost_expiry ? (
          <div style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--accent)', fontWeight: '600' }}>
            🚀 Boost actif jusqu'au {new Date(announcement.boost_expiry).toLocaleDateString('fr-FR')} à {new Date(announcement.boost_expiry).toLocaleTimeString('fr-FR')}
          </div>
        ) : null}

        {announcement.average_rating ? (
          <div style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--text-light)' }}>
            ⭐ {announcement.average_rating} / 5 · {announcement.review_count} avis
          </div>
        ) : (
          <div style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--text-light)' }}>
            ⭐ Pas encore de note pour ce prestataire
          </div>
        )}

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

        {user?.id === announcement.user_id && !isBoosted && (
          <button
            onClick={handleBoost}
            disabled={boostLoading}
            className="btn btn-accent"
            style={{ marginTop: 'var(--spacing-md)' }}
          >
            {boostLoading ? 'Génération du paiement...' : 'Booster cette annonce (1000 FCFA)'}
          </button>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: 'var(--spacing-md)' }}>
          {/* Bouton Contacter - Visible si on n'est pas le propriétaire */}
          {user?.id !== announcement.user_id && (
            <>
              {sellerPhone && (
                <a
                  href={`https://wa.me/${sellerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis LocaPlus pour votre annonce : ${announcement.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  💬 Contacter via WhatsApp
                </a>
              )}
              {sellerPhone && (
                <a
                  href={`tel:${sellerPhone.replace(/\D/g, '')}`}
                  className="btn btn-outline"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  ☎️ Appeler
                </a>
              )}
              {sellerEmail && (
                <a
                  href={`mailto:${sellerEmail}?subject=${encodeURIComponent(`Demande de contact - ${announcement.title}`)}&body=${encodeURIComponent(`Bonjour,\n\nJe vous contacte depuis LocaPlus concernant votre annonce : ${announcement.title}`)}`}
                  className="btn btn-outline"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  📧 Email
                </a>
              )}
            </>
          )}
          
          <button onClick={handleReport} className="btn btn-outline" disabled={reportLoading}>
            {reportLoading ? 'Signalement en cours...' : '🚩 Signaler'}
          </button>
        </div>

        <hr style={{ margin: 'var(--spacing-lg) 0', border: 'none', borderTop: '1px solid var(--border)' }} />

        <h3 className="mb-2">Description</h3>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
          {announcement.description || 'Aucune description fournie.'}
        </p>

        {/* Métadonnées spécifiques selon la catégorie */}
        {detailsEntries.length > 0 && (
          <>
            <hr style={{ margin: 'var(--spacing-lg) 0', border: 'none', borderTop: '1px solid var(--border)' }} />
            <h3 className="mb-2">Détails</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
              {detailsEntries.map(([key, value]) => (
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
          
          {sellerPhone && (
            <p className="mb-2">
              <strong>Téléphone:</strong> {sellerPhone}
            </p>
          )}
          
          {announcement.user_email && (
            <p className="mb-3">
              <strong>Email:</strong> {announcement.user_email}</p>
          )}

          {sellerPhone ? (
            <>
              <a
                href={`https://wa.me/${sellerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis LocaPlus pour votre annonce : ${announcement.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full mb-3"
                style={{
                  backgroundColor: '#25D366',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600'
                }}
              >
                💬 Contacter sur WhatsApp
              </a>
              <a 
                href={`tel:${sellerPhone}`} 
                className="btn btn-accent w-full"
              >
                📞 Appeler maintenant
              </a>
            </>
          ) : sellerEmail ? (
            <a
              href={`mailto:${sellerEmail}?subject=${encodeURIComponent(`Contact LocaPlus : ${announcement.title}`)}`}
              className="btn btn-accent w-full"
              style={{ textAlign: 'center' }}
            >
              ✉️ Contacter par email
            </a>
          ) : (
            <p style={{ color: '#999', fontSize: '0.875rem' }}>Aucun contact disponible pour cette annonce</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetail;