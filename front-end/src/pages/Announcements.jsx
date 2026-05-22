// filepath: front-end/src/pages/Announcements.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Flag, Rocket, Search, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { announcementService, reportService } from '../services/api';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/formatPrice';

const setPageMeta = (title, description) => {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  meta.content = description;
};

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
      return <Search size={18} />;
  }
};

const Announcements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  
  // Filtres
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    location: searchParams.get('location') || '',
    search: searchParams.get('search') || '',
  });


  useEffect(() => {
    setPageMeta('Annonces - LocaPlus', 'Découvrez toutes les annonces immobilières, véhicules, matériaux et techniciens sur LocaPlus. Filtrez, explorez et contactez rapidement.');
    fetchAnnouncements();
  }, [searchParams]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(searchParams);
      if (!params.page) params.page = 1;
      const response = await announcementService.getAll(params);
      const results = response.data?.announcements ?? [];
      if (import.meta.env.DEV) console.log('DEBUG Announcements.jsx - Annonces chargées:', (results?.length || 0), results);
      setAnnouncements(Array.isArray(results) ? results : []);
      setPagination(prev => ({
        ...prev,
        page: Number(response.data?.pagination?.page) || 1,
        limit: Number(response.data?.pagination?.limit) || prev.limit,
        total: Number(response.data?.pagination?.total) || 0,
        pages: Number(response.data?.pagination?.pages) || 0,
      }));
    } catch (error) {
      console.error('Erreur fetchAnnouncements:', error);
      setAnnouncements([]);
      setError('Impossible de charger les annonces. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      search: '',
    });
    setSearchParams({ page: '1' });
  };

  const handleReport = async (announcementId) => {
    if (!user) {
      return window.alert('Veuillez vous connecter pour signaler une annonce.');
    }

    const reason = window.prompt('Indiquez la raison du signalement :');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      await reportService.create({ announcementId, reason: reason.trim() });
      window.alert('Signalement envoyé.');
    } catch (err) {
      console.error('Erreur signalement:', err);
      window.alert(err.response?.data?.error || 'Impossible de signaler cette annonce.');
    }
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="announcements-section">
      <h1 className="mb-4">Annonces</h1>

      {/* Filtres */}
      <div className="filters">
        <div className="filters-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Recherche</label>
            <input
              type="text"
              name="search"
              className="form-input"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Catégorie</label>
            <select
              name="category"
              className="form-select"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">Toutes les catégories</option>
              <option value="immobilier">Immobilier</option>
              <option value="vehicule">Véhicules</option>
              <option value="materiaux">Matériaux de construction</option>
              <option value="technicien">Techniciens</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select
              name="type"
              className="form-select"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">Tous les types</option>
              <option value="vente">Vente</option>
              <option value="location">Location</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Localisation</label>
            <input
              type="text"
              name="location"
              className="form-input"
              placeholder="Ville..."
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Prix min (FCFA)</label>
            <input
              type="number"
              name="minPrice"
              className="form-input"
              placeholder="0"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Prix max (FCFA)</label>
            <input
              type="number"
              name="maxPrice"
              className="form-input"
              placeholder=" "
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="filters-actions">
          <button onClick={applyFilters} className="btn btn-primary">
            Appliquer les filtres
          </button>
          <button onClick={clearFilters} className="btn btn-outline">
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="skeleton-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-line title" />
              <div className="skeleton-line short" />
              <div className="skeleton-line bar" />
              <div className="skeleton-line bar" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={fetchAnnouncements} className="btn btn-primary" type="button">
            Réessayer
          </button>
        </div>
      ) : (announcements?.length || 0) > 0 ? (
        <>
          <p className="text-muted mb-3">
            {pagination.total} annonce{pagination.total !== 1 ? 's' : ''} trouvée{pagination.total !== 1 ? 's' : ''}
          </p>
          
          <div className="announcements-grid">
            {announcements.map((announcement) => {
              const announcementId = announcement._id || announcement.id;
              const parsedImages = parseImages(announcement.images);
              const rawImage = announcement.image_url || parsedImages[0];
              const imageUrl = resolveImageUrl(rawImage);
              const sellerPhone = announcement.user_phone || announcement.phone || announcement.phone_number || announcement.user_phone_number;
              const location = announcement.location || announcement.geolocalisation || 'Localisation non spécifiée';
              const isBoosted = announcement.is_boosted ?? announcement.statut_boost ?? false;

              if (import.meta.env.DEV) {
                console.log('DEBUG Announcements image', {
                  announcementId,
                  rawImages: announcement.images,
                  parsedImages,
                  imageUrl,
                });
              }

              return (
                <Link 
                  to={`/announcements/${announcementId}`} 
                  key={announcementId || announcement.title}
                  className="card announcement-card"
                >
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={announcement.title}
                      className="card-image"
                      loading="lazy"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="card-image card-image-fallback" style={{ 
                      backgroundColor: '#E2E8F0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minHeight: '180px'
                    }}>
                      {categoryIcon(announcement.category)}
                    </div>
                  )}
                  <div className="card-body">
                    <div className="d-flex justify-between align-center mb-2">
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {categoryIcon(announcement.category)} {announcement.category || 'Annonce'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isBoosted && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            backgroundColor: '#FFB703',
                            color: 'var(--primary)',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            Boosté
                          </span>
                        )}
                        {announcement.is_favorite && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#E53E3E',
                            fontWeight: '700'
                          }}>
                            Favori
                          </span>
                        )}
                        {announcement.type && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            {announcement.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="card-title">{announcement.title}</h3>
                    <p className="card-text">{announcement.description?.substring(0, 80)}...</p>
                    <div className="card-price">
                      {announcement.category === 'technicien' || announcement.price === 0 
                        ? 'Prix à négocier' 
                        : formatPrice(announcement.price)}
                    </div>
                    <div className="card-meta" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} /> {location}
                      </span>
                      {sellerPhone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} /> {sellerPhone}
                        </span>
                      ) : null}
                    </div>
                    <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/announcements/${announcementId}`);
                        }}
                        className="btn btn-outline"
                        style={{ flex: 1, minWidth: '80px' }}
                      >
                        <Eye size={14} style={{ marginRight: '6px' }} /> Voir
                      </button>
                      {(announcement.user_phone || announcement.phone) ? (
                        <a
                          href={`https://wa.me/${(announcement.user_phone || announcement.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis LocaPlus pour votre annonce : ${announcement.title}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp"
                          style={{ flex: 1, minWidth: '100px', textDecoration: 'none', textAlign: 'center' }}
                        >
                          <Phone size={14} style={{ marginRight: '6px' }} /> Contact
                        </a>
                      ) : (
                        <button type="button" className="btn btn-outline" disabled style={{ flex: 1, minWidth: '100px' }}>
                          Pas de contact
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReport(announcementId);
                        }}
                        className="btn btn-ghost"
                        style={{ minWidth: '80px', fontSize: '0.875rem' }}
                      >
                        <Flag size={14} style={{ marginRight: '6px' }} /> Signaler
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="d-flex justify-between align-center mt-4" style={{ gap: '8px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-outline btn-sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Précédent
              </button>
              
              <span className="text-muted">
                Page {pagination.page} sur {pagination.pages}
              </span>
              
              <button 
                className="btn btn-outline btn-sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center" style={{ padding: '64px' }}>
          <p className="text-muted">Aucune annonce ne correspond à vos critères.</p>
          <button onClick={clearFilters} className="btn btn-primary mt-3">
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};

export default Announcements;