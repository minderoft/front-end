import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Zap, Building2, Truck, HardHat, Wrench, MapPin, Phone, Flag, Rocket, Eye } from 'lucide-react';
import { announcementService, adService } from '../services/api';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/formatPrice';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [sponsoredAds, setSponsoredAds] = useState([]);
  const [bannerAds, setBannerAds] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [loadingSponsored, setLoadingSponsored] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    document.title = 'LocaPlus - La marketplace sécurisée en Côte d\'Ivoire';
  }, []);

  // Fetch latest 4 announcements for homepage
  useEffect(() => {
    const fetchRecentAnnouncements = async () => {
      try {
        const response = await announcementService.getAll({ limit: 4, page: 1 });
        const results = response.data?.announcements ?? [];
        setRecentAnnouncements(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Erreur fetch recent announcements:', error);
        setRecentAnnouncements([]);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    const fetchSponsoredAds = async () => {
      try {
        const response = await announcementService.getSponsored({ limit: 4 });
        const results = response.data?.announcements ?? [];
        setSponsoredAds(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Erreur fetch sponsored ads:', error);
        setSponsoredAds([]);
      } finally {
        setLoadingSponsored(false);
      }
    };

    const fetchBannerAds = async () => {
      try {
        const response = await adService.getActive({ limit: 6 });
        const results = response.data?.ads ?? [];
        setBannerAds(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Erreur fetch banner ads:', error);
        setBannerAds([]);
      } finally {
        setLoadingBanners(false);
      }
    };

    fetchRecentAnnouncements();
    fetchSponsoredAds();
    fetchBannerAds();
  }, []);

  const categories = [
    { id: 'immobilier', name: 'Immobilier', icon: Building2 },
    { id: 'vehicule', name: 'Véhicules', icon: Truck },
    { id: 'materiaux', name: 'Matériaux de construction', icon: HardHat },
    { id: 'technicien', name: 'Techniciens', icon: Wrench },
  ];

  const categoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'immobilier':
        return <Flag size={18} />;
      case 'vehicule':
        return <Rocket size={18} />;
      case 'materiaux':
        return <MapPin size={18} />;
      case 'technicien':
        return <Phone size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const getCategoryBadgeColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'immobilier':
        return 'badge-immobilier';
      case 'vehicule':
        return 'badge-vehicule';
      case 'materiaux':
        return 'badge-materiaux';
      case 'technicien':
        return 'badge-technicien';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            LocaPlus est une plateforme de mise en relation et de publicité en Côte d'Ivoire.
          </h1>
          <p className="home-hero-subtitle">
            La marketplace sécurisée pour propulser vos activités, trouver un logement, un véhicule ou un technicien qualifié.
          </p>
        </div>
      </section>

      {/* Two-Pillar Dashboard */}
      <section className="home-dashboard">
        <div className="dashboard-container">
          {/* Pillar 1: Espace Annonces */}
          <div className="dashboard-pillar">
            <div className="pillar-header">
              <FileText size={28} className="pillar-icon" />
              <h2 className="pillar-title">Espace Annonces</h2>
            </div>
            <p className="pillar-subtitle">Découvrez nos catégories principales</p>
            
            <div className="categories-grid">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <Link
                    key={cat.id}
                    to={`/announcements?category=${cat.id}`}
                    className="category-button"
                  >
                    <div className="category-button-icon">
                      <IconComponent size={32} />
                    </div>
                    <span className="category-button-text">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pillar 2: Espace Publicitaire */}
          <div className="dashboard-pillar">
            <div className="pillar-header">
              <Zap size={28} className="pillar-icon" />
              <h2 className="pillar-title">Espace Publicitaire</h2>
            </div>
            <p className="pillar-subtitle">Mettez en avant vos offres</p>
            
            <div className="advertising-section">
              <div className="ad-placeholder">
                <Zap size={48} className="ad-placeholder-icon" />
                <h3 className="ad-placeholder-title">Contenu Publicitaire Premium</h3>
                <p className="ad-placeholder-text">
                  Découvrez les offres premium de nos partenaires et créateurs.
                </p>
                <Link to="/create-ad" className="ad-create-button">
                  Créer une Publicité
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Annonces Récentes */}
      <section className="recent-announcements-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Annonces Récentes</h2>
            <Link to="/announcements" className="view-all-link">
              Voir toutes les annonces →
            </Link>
          </div>

          {loadingAnnouncements ? (
            <div className="announcements-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="announcement-card-loading">
                  <div className="card-skeleton-image" />
                  <div className="card-skeleton-content">
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-desc" />
                    <div className="skeleton-line skeleton-desc-short" />
                    <div className="skeleton-line skeleton-price" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentAnnouncements.length > 0 ? (
            <div className="announcements-grid">
              {recentAnnouncements.map((announcement) => {
                const announcementId = announcement._id || announcement.id;
                const parsedImages = parseImages(announcement.images);
                const rawImage = announcement.image_url || parsedImages[0];
                const imageUrl = resolveImageUrl(rawImage);
                const isBoosted = announcement.is_boosted ?? announcement.statut_boost ?? false;

                return (
                  <Link
                    key={announcementId || announcement.title}
                    to={`/announcements/${announcementId}`}
                    className="announcement-card home-announcement-card"
                  >
                    {/* Thumbnail Container */}
                    <div className="card-thumbnail">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={announcement.title}
                          className="card-thumbnail-image"
                          loading="lazy"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="card-thumbnail-placeholder">
                          {categoryIcon(announcement.category)}
                        </div>
                      )}
                      {isBoosted && (
                        <div className="card-badge-boosted">
                          <Rocket size={12} />
                          <span>Boosté</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="card-content">
                      {/* Category Badge */}
                      <span className={`card-category-badge ${getCategoryBadgeColor(announcement.category)}`}>
                        {announcement.category || 'Annonce'}
                      </span>

                      {/* Title */}
                      <h3 className="card-title">{announcement.title}</h3>

                      {/* Location */}
                      <div className="card-location">
                        <MapPin size={14} />
                        <span>{announcement.location || 'Localisation non spécifiée'}</span>
                      </div>

                      {/* Price */}
                      <div className="card-price">
                        {announcement.category === 'technicien' || announcement.price === 0
                          ? 'Sur devis'
                          : formatPrice(announcement.price)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="no-announcements">
              <p>Aucune annonce disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Section: Publicités Sponsorisées */}
      <section className="sponsored-ads-section">
        <div className="section-container">
          <div className="section-header">
            <div className="sponsored-header">
              <Zap size={24} className="sponsored-icon" />
              <h2 className="section-title">Publicités Sponsorisées</h2>
            </div>
            <Link to="/announcements?boosted=true" className="view-all-link">
              Voir plus →
            </Link>
          </div>

          {loadingSponsored ? (
            <div className="sponsored-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="sponsored-banner-loading">
                  <div className="skeleton-banner" />
                </div>
              ))}
            </div>
          ) : sponsoredAds.length > 0 ? (
            <div className="sponsored-grid">
              {sponsoredAds.map((ad) => {
                const adId = ad._id || ad.id;
                const parsedImages = parseImages(ad.images);
                const rawImage = ad.image_url || parsedImages[0];
                const imageUrl = resolveImageUrl(rawImage);

                return (
                  <Link
                    key={adId || ad.title}
                    to={`/announcements/${adId}`}
                    className="sponsored-banner"
                  >
                    <div className="sponsored-banner-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={ad.title}
                          className="sponsored-banner-img"
                          loading="lazy"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="sponsored-banner-placeholder">
                          <Zap size={32} />
                          <span>{ad.title}</span>
                        </div>
                      )}
                      <div className="sponsored-overlay">
                        <span className="sponsored-label">
                          <Zap size={14} /> Sponsorisé
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="no-ads">
              <p>Aucune publicité sponsorisée pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Section: Partenaires & Publicités (Banner Ads) */}
      <section className="partners-ads-section">
        <div className="section-container">
          <div className="section-header">
            <div className="sponsored-header">
              <Zap size={24} className="sponsored-icon" />
              <h2 className="section-title">Partenaires & Publicités</h2>
            </div>
            <Link to="/create-ad" className="ad-create-link">
              Créer une publicité →
            </Link>
          </div>

          {loadingBanners ? (
            <div className="partners-banner-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="partners-banner-loading">
                  <div className="skeleton-banner" />
                </div>
              ))}
            </div>
          ) : bannerAds.length > 0 ? (
            <div className="partners-banner-grid">
              {bannerAds.map((ad) => {
                const adId = ad.id;
                const parsedImages = typeof ad.images === 'string' 
                  ? JSON.parse(ad.images || '[]') 
                  : ad.images || [];
                const rawImage = ad.image_url || parsedImages[0];
                const imageUrl = rawImage 
                  ? (rawImage.startsWith('http') ? rawImage : `${import.meta.env.VITE_BACKEND_URL || 'https://backend-ovbc.onrender.com'}${rawImage}`)
                  : null;

                return (
                  <a
                    key={adId}
                    href={ad.link_url || '#'}
                    target={ad.link_url ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="partners-banner-card"
                    onClick={(e) => {
                      if (!ad.link_url) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="partners-banner-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={ad.title}
                          className="partners-banner-img"
                          loading="lazy"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="partners-banner-placeholder">
                          <Zap size={32} />
                          <span>{ad.title}</span>
                        </div>
                      )}
                      <div className="partners-banner-overlay">
                        <span className="partners-banner-label">
                          <Zap size={12} /> Partenaire
                        </span>
                      </div>
                    </div>
                    <div className="partners-banner-content">
                      <h3 className="partners-banner-title">{ad.title}</h3>
                      {ad.description && (
                        <p className="partners-banner-desc line-clamp-2">{ad.description}</p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="no-partners-ads">
              <div className="no-partners-content">
                <Zap size={48} className="no-ads-icon" />
                <h3 className="no-ads-title">Espace Publicitaire Disponible</h3>
                <p className="no-ads-text">
                  Soyez le premier à afficher votre publicité dans cet espace premium.
                </p>
                <Link to="/create-ad" className="btn btn-accent btn-lg">
                  Créer une Publicité
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
