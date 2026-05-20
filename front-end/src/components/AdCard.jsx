import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, MapPin, Phone, MessageSquare, Sparkles } from 'lucide-react';
import '../styles/AdCard.css';
import { resolveImageUrl, parseImages, handleImageError } from '../utils/imageUtils';
import { announcementService } from '../services/api';

const AdCard = ({ announcement, onBoost }) => {
  const navigate = useNavigate();
  const announcementId = announcement._id || announcement.id;
  const parsedImages = parseImages(announcement.images);
  const rawImage = announcement.image_url || parsedImages[0];
  const imageUrl = resolveImageUrl(rawImage);
  const sellerPhone = announcement.user_phone || announcement.phone || announcement.phone_number || announcement.user_phone_number || '';
  const location = announcement.location || announcement.geolocalisation || '';
  const isBoosted = announcement.is_boosted ?? announcement.statut_boost ?? false;

  const handleView = () => navigate(`/announcements/${announcement._id || announcement.id}`);
  const handleWhatsApp = (e) => {
    e.preventDefault();
    if (sellerPhone) {
      const phoneNumber = sellerPhone.replace(/\D/g, '');
      const message = encodeURIComponent(`Bonjour, je vous contacte depuis LocaPlus pour votre annonce : ${announcement.title}`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    }
  };
  const handleCall = (e) => {
    e.preventDefault();
    if (sellerPhone) {
      window.location.href = `tel:${sellerPhone.replace(/\D/g, '')}`;
    }
  };

  // Fire-and-forget tracking
  const fireTracking = (action) => {
    try {
      announcementService.trackClick(announcementId, action).catch((err) => {
        if (import.meta.env.DEV) console.warn('Tracking failed', action, err?.message || err);
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Tracking error', err);
    }
  };

  const handleViewWithTrack = () => {
    fireTracking('click');
    handleView();
  };

  const handleWhatsAppWithTrack = (e) => {
    fireTracking('whatsapp');
    handleWhatsApp(e);
  };

  const handleCallWithTrack = (e) => {
    fireTracking('call');
    handleCall(e);
  };

  return (
    <article className="card announcement-card adcard" style={{ position: 'relative' }}>
      {announcement.is_sponsored && (
        <div className="sponsored-badge" style={{ position: 'absolute', left: 12, top: 12, zIndex: 20 }}>
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded">⭐ Sponsorisé</span>
        </div>
      )}

      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={announcement.title} 
          className="card-image" 
          loading="lazy" 
          crossOrigin="anonymous"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/600x400?text=Image+non+disponible';
          }}
        />
      ) : (
        <div className="card-image card-image-fallback" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HomeIcon size={42} color="#64748B" />
        </div>
      )}

      <div className="card-body">
        <div className="d-flex justify-between align-center" style={{ gap: '8px' }}>
          <span className="card-tag">{announcement.category}</span>
          {isBoosted && (
              <span className="card-tag boosted">
                <Sparkles size={14} style={{ marginRight: '6px' }} /> Boosté
              </span>
            )}
        </div>

        <h3 className="card-title">{announcement.title}</h3>
        <p className="card-text">{announcement.description?.substring(0, 120)}...</p>
        <div className="card-price">{announcement.price?.toLocaleString() || 0} FCFA</div>
        <div className="card-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} />
          <span>{location}</span>
        </div>

        <div className="card-actions">
          <button type="button" onClick={handleViewWithTrack} className="btn btn-outline btn-sm">Voir</button>

          {sellerPhone ? (
            <>
              <button type="button" onClick={handleCallWithTrack} className="btn btn-call btn-sm">
                <Phone size={14} style={{ marginRight: '6px' }} /> Appeler
              </button>
              <button type="button" onClick={handleWhatsAppWithTrack} className="btn btn-whatsapp btn-sm">
                <MessageSquare size={14} style={{ marginRight: '6px' }} /> WhatsApp
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" disabled>Pas de contact</button>
          )}

          {!isBoosted && onBoost && (
            <button type="button" className="btn btn-boost btn-sm" onClick={() => onBoost(announcementId)}>
              <Sparkles size={14} style={{ marginRight: '6px' }} /> Booster (1000 FCFA)
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default AdCard;
