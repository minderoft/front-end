import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdCard.css';
import { resolveImageUrl, parseImages, handleImageError } from '../utils/imageUtils';

const AdCard = ({ announcement, onBoost }) => {
  const navigate = useNavigate();
  const parsedImages = parseImages(announcement.images);
  const rawImage = announcement.image_url || parsedImages[0];
  const imageUrl = resolveImageUrl(rawImage);
  const sellerPhone = announcement.user_phone || announcement.phone || announcement.phone_number || announcement.user_phone_number || '';
  const location = announcement.location || announcement.geolocalisation || '';
  const isBoosted = announcement.is_boosted ?? announcement.statut_boost ?? false;

  const handleView = () => navigate(`/announcements/${announcement.id}`);
  const handleCall = () => {
    if (!sellerPhone) return;
    window.location.href = `tel:${sellerPhone.replace(/\D/g, '')}`;
  };

  return (
    <article className="card announcement-card adcard">
      {imageUrl ? (
        <img src={imageUrl} alt={announcement.title} className="card-image" loading="lazy" onError={handleImageError} />
      ) : (
        <div className="card-image card-image-fallback">🏠</div>
      )}

      <div className="card-body">
        <div className="d-flex justify-between align-center" style={{ gap: '8px' }}>
          <span className="card-tag">{announcement.category}</span>
          {isBoosted && (
            <span className="card-tag boosted">🚀 Boosté</span>
          )}
        </div>

        <h3 className="card-title">{announcement.title}</h3>
        <p className="card-text">{announcement.description?.substring(0, 120)}...</p>
        <div className="card-price">{announcement.price?.toLocaleString() || 0} FCFA</div>
        <div className="card-meta"><span>📍 {location}</span></div>

        <div className="card-actions">
          <button type="button" onClick={handleView} className="btn btn-outline">Voir</button>

          {sellerPhone ? (
            <>
              <a href={`tel:${sellerPhone.replace(/\D/g, '')}`} className="btn btn-call">📞 Appeler</a>
              <a
                href={`https://wa.me/${sellerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis LocaPlus pour votre annonce : ${announcement.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                💬 WhatsApp
              </a>
            </>
          ) : (
            <button type="button" className="btn btn-outline" disabled>Pas de contact</button>
          )}

          {!isBoosted && onBoost && (
            <button type="button" className="btn btn-boost" onClick={() => onBoost(announcement.id)}>
              🚀 Booster (1000 FCFA)
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default AdCard;
