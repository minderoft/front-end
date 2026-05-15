// filepath: front-end/src/pages/Announcements.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { announcementService, reportService } from '../services/api';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';

const Announcements = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
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
    fetchAnnouncements();
  }, [searchParams]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(searchParams);
      const response = await announcementService.getAll({
        ...params,
        page: pagination.page,
        limit: pagination.limit,
      });
      setAnnouncements(response.data.announcements);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Erreur:', error);
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
    setSearchParams({});
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
    setPagination(prev => ({ ...prev, page: newPage }));
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
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : announcements.length > 0 ? (
        <>
          <p className="text-muted mb-3">
            {pagination.total} annonce{pagination.total !== 1 ? 's' : ''} trouvée{pagination.total !== 1 ? 's' : ''}
          </p>
          
          <div className="announcements-grid">
            {announcements.map((announcement) => {
              const parsedImages = parseImages(announcement.images);
              const imageUrl = resolveImageUrl(parsedImages[0]);

              if (import.meta.env.DEV) {
                console.log('DEBUG Announcements image', {
                  announcementId: announcement.id,
                  rawImages: announcement.images,
                  parsedImages,
                  imageUrl,
                });
              }

              return (
                <Link 
                  to={`/announcements/${announcement.id}`} 
                  key={announcement.id}
                  className="card"
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
                    <div className="card-image" style={{ 
                      backgroundColor: '#E2E8F0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '3rem'
                    }}>
                      🏠
                    </div>
                  )}
                  <div className="card-body">
                    <div className="d-flex justify-between align-center mb-2">
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        fontWeight: '600'
                      }}>
                        {announcement.category}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {announcement.is_boosted && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            backgroundColor: '#FFB703',
                            color: 'var(--primary)',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            🚀 Boosté
                          </span>
                        )}
                        {announcement.is_favorite && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#E53E3E',
                            fontWeight: '700'
                          }}>
                            ♥ Favori
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
                        : `${announcement.price?.toLocaleString()} FCFA`}
                    </div>
                    <div className="card-meta">
                      <span>📍 {announcement.location}</span>
                      {announcement.user_phone ? <span>📞 {announcement.user_phone}</span> : announcement.phone && <span>📞 {announcement.phone}</span>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReport(announcement.id);
                      }}
                      className="btn btn-outline"
                      style={{ marginTop: '12px' }}
                    >
                      Signaler
                    </button>
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