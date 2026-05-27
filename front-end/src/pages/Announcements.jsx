// filepath: front-end/src/pages/Announcements.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Flag, Rocket, Search, Eye, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { announcementService, reportService } from '../services/api';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/formatPrice';
import './Announcements.css';

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

const getCategoryBadgeClass = (category) => {
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

const getTypeBadgeClass = (type) => {
  return type === 'vente' ? 'badge-vente' : 'badge-location';
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
    <div className="announcements-page">
      {/* Header */}
      <div className="announcements-header">
        <div className="container">
          <div className="header-content">
            <h1 className="header-title">
              Découvrez les Annonces
            </h1>
            <p className="header-subtitle">
              Explorez des milliers d'annonces immobilières, véhicules, matériaux et services dans votre région.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12 lg:py-16">
        <div className="announcements-layout">
          {/* Sidebar Filtres */}
          <aside className="filters-sidebar">
            <div className="filters-card">
              <div className="filters-header">
                <Search size={20} />
                <h3 className="filters-title">Filtrer</h3>
              </div>
              <div className="filters-body">
                {/* Recherche */}
                <div className="filter-group">
                  <label className="filter-label">
                    Recherche
                  </label>
                  <input
                    type="text"
                    name="search"
                    className="filter-input"
                    placeholder="Mots-clés..."
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Catégorie */}
                <div className="filter-group">
                  <label className="filter-label">
                    Catégorie
                  </label>
                  <select
                    name="category"
                    className="filter-select"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">Toutes les catégories</option>
                    <option value="immobilier">Immobilier</option>
                    <option value="vehicule">Véhicules</option>
                    <option value="materiaux">Matériaux BTP</option>
                    <option value="technicien">Techniciens</option>
                  </select>
                </div>

                {/* Type */}
                <div className="filter-group">
                  <label className="filter-label">
                    Type
                  </label>
                  <select
                    name="type"
                    className="filter-select"
                    value={filters.type}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les types</option>
                    <option value="vente">Vente</option>
                    <option value="location">Location</option>
                  </select>
                </div>

                {/* Localisation */}
                <div className="filter-group">
                  <label className="filter-label">
                    Localisation
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="filter-input"
                    placeholder="Ville..."
                    value={filters.location}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Prix min */}
                <div className="filter-group">
                  <label className="filter-label">
                    Prix minimum (FCFA)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    className="filter-input"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Prix max */}
                <div className="filter-group">
                  <label className="filter-label">
                    Prix maximum (FCFA)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    className="filter-input"
                    placeholder="∞"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Boutons */}
                <div className="filter-actions">
                  <button
                    onClick={applyFilters}
                    className="btn btn-primary btn-block"
                  >
                    <Search size={18} />
                    Appliquer les filtres
                  </button>
                  <button
                    onClick={clearFilters}
                    className="btn btn-secondary btn-block"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Contenu Principal */}
          <main className="announcements-main">
            {/* Résultats */}
            {loading ? (
              <div className="announcements-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="announcement-card-loading">
                    <div className="card-skeleton-image" />
                    <div className="card-skeleton-content">
                      <div className="skeleton-badges" />
                      <div className="skeleton-line skeleton-title" />
                      <div className="skeleton-line skeleton-desc" />
                      <div className="skeleton-line skeleton-desc-short" />
                      <div className="skeleton-footer">
                        <div className="skeleton-line skeleton-location" />
                        <div className="skeleton-line skeleton-price" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="error-card">
                <div className="error-content">
                  <p className="error-text">{error}</p>
                  <button
                    onClick={fetchAnnouncements}
                    className="btn btn-primary"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (announcements?.length || 0) > 0 ? (
              <div className="announcements-results">
                {/* Compteur */}
                <div className="results-header">
                  <p className="results-count">
                    <span className="count-number">{pagination.total}</span>{' '}
                    annonce{pagination.total !== 1 ? 's' : ''} trouvée
                    {pagination.total !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Grille d'annonces */}
                <div className="announcements-grid">
                  {announcements.map((announcement) => {
                    const announcementId = announcement._id || announcement.id;
                    const parsedImages = parseImages(announcement.images);
                    const rawImage = announcement.image_url || parsedImages[0];
                    const imageUrl = resolveImageUrl(rawImage);
                    const sellerPhone =
                      announcement.user_phone ||
                      announcement.phone ||
                      announcement.phone_number ||
                      announcement.user_phone_number;
                    const location =
                      announcement.location ||
                      announcement.geolocalisation ||
                      'Localisation non spécifiée';
                    const isBoosted =
                      announcement.is_boosted ?? announcement.statut_boost ?? false;

                    return (
                      <Link
                        to={`/announcements/${announcementId}`}
                        key={announcementId || announcement.title}
                        className="announcement-card"
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
                        <div className="card-body">
                          {/* Badges */}
                          <div className="card-badges">
                            <span className={`card-category-badge ${getCategoryBadgeClass(announcement.category)}`}>
                              {announcement.category || 'Annonce'}
                            </span>
                            {announcement.type && (
                              <span className={`card-type-badge ${getTypeBadgeClass(announcement.type)}`}>
                                {announcement.type === 'vente' ? 'Vente' : 'Location'}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="card-title">{announcement.title}</h3>

                          {/* Description */}
                          <p className="card-description">
                            {announcement.description?.substring(0, 100)}
                          </p>

                          {/* Location */}
                          <div className="card-location">
                            <MapPin size={14} />
                            <span>{location}</span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="card-footer">
                          <div className="price-section">
                            <span className="price-label">Prix</span>
                            <span className="card-price">
                              {announcement.category === 'technicien' || announcement.price === 0
                                ? 'Sur devis'
                                : formatPrice(announcement.price)}
                            </span>
                          </div>
                          <div className="action-section">
                            {sellerPhone ? (
                              <a
                                href={`https://wa.me/${sellerPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-accent btn-sm"
                                onClick={(e) => e.preventDefault()}
                              >
                                <Phone size={14} />
                                Contacter
                              </a>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled
                              >
                                Pas de contact
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleReport(announcementId);
                              }}
                              className="btn-icon"
                              title="Signaler"
                            >
                              <Flag size={16} />
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-secondary"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      ← Précédent
                    </button>

                    <span className="pagination-info">
                      Page {pagination.page} sur {pagination.pages}
                    </span>

                    <button
                      className="btn btn-secondary"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-content">
                  <Search size={48} className="empty-icon" />
                  <h3 className="empty-title">Aucune annonce trouvée</h3>
                  <p className="empty-text">
                    Aucune annonce ne correspond à vos critères de recherche.
                  </p>
                  <button onClick={clearFilters} className="btn btn-primary">
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Announcements;