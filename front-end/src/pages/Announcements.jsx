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
    <div className="bg-bg-primary min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-light py-16 lg:py-20">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Découvrez les Annonces
            </h1>
            <p className="text-lg text-primary-lightest">
              Explorez des milliers d'annonces immobilières, véhicules, matériaux et services dans votre région.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12 lg:py-16">
        <div className="grid lg:grid-2 gap-8">
          {/* Sidebar Filtres */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24 lg:sticky lg:top-24">
              <div className="card-header">
                <h3 className="text-xl font-bold">Filtrer</h3>
              </div>
              <div className="card-body space-y-6">
                {/* Recherche */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Recherche
                  </label>
                  <input
                    type="text"
                    name="search"
                    className="input w-full"
                    placeholder="Mots-clés..."
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Catégorie */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Catégorie
                  </label>
                  <select
                    name="category"
                    className="input w-full"
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
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Type
                  </label>
                  <select
                    name="type"
                    className="input w-full"
                    value={filters.type}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les types</option>
                    <option value="vente">Vente</option>
                    <option value="location">Location</option>
                  </select>
                </div>

                {/* Localisation */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Localisation
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="input w-full"
                    placeholder="Ville..."
                    value={filters.location}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Prix min */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Prix minimum (FCFA)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    className="input w-full"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Prix max */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Prix maximum (FCFA)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    className="input w-full"
                    placeholder="∞"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Boutons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-border-color">
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
          </div>

          {/* Contenu Principal */}
          <div className="lg:col-span-1">

            {/* Résultats */}
            {loading ? (
              <div className="grid gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="card animate-pulse"
                  >
                    <div className="flex gap-4">
                      <div className="w-32 h-32 bg-slate-200 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-full" />
                        <div className="h-3 bg-slate-200 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="card bg-error-light border-error">
                <div className="card-body text-center">
                  <p className="text-error font-semibold mb-4">{error}</p>
                  <button
                    onClick={fetchAnnouncements}
                    className="btn btn-primary"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (announcements?.length || 0) > 0 ? (
              <div className="space-y-6">
                {/* Compteur */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-tertiary">
                    <span className="font-semibold text-text-primary">
                      {pagination.total}
                    </span>{' '}
                    annonce{pagination.total !== 1 ? 's' : ''} trouvée
                    {pagination.total !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Grille d'annonces */}
                <div className="space-y-4">
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
                        className="card group hover:shadow-xl transition-all overflow-hidden"
                      >
                        <div className="flex gap-6">
                          {/* Image */}
                          <div className="w-40 h-40 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={announcement.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={handleImageError}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                {categoryIcon(announcement.category)}
                              </div>
                            )}
                            {isBoosted && (
                              <div className="absolute top-2 right-2 badge badge-accent">
                                <Rocket size={14} />
                                Boosté
                              </div>
                            )}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 flex flex-col justify-between py-2">
                            <div>
                              {/* Badges */}
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <span className="badge badge-primary">
                                  {announcement.category || 'Annonce'}
                                </span>
                                {announcement.type && (
                                  <span className="badge badge-accent text-xs">
                                    {announcement.type === 'vente'
                                      ? 'Vente'
                                      : 'Location'}
                                  </span>
                                )}
                              </div>

                              {/* Titre */}
                              <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {announcement.title}
                              </h3>

                              {/* Description */}
                              <p className="text-sm text-text-tertiary mb-4 line-clamp-2">
                                {announcement.description?.substring(0, 100)}
                              </p>

                              {/* Info supplémentaires */}
                              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                                <span className="flex items-center gap-1">
                                  <MapPin size={16} />
                                  {location}
                                </span>
                              </div>
                            </div>

                            {/* Prix et Actions */}
                            <div className="flex items-end justify-between pt-4 border-t border-border-color">
                              <div>
                                <p className="text-xs text-text-tertiary">Prix</p>
                                <p className="text-2xl font-bold text-accent">
                                  {announcement.category === 'technicien' ||
                                  announcement.price === 0
                                    ? 'Sur devis'
                                    : formatPrice(announcement.price)}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {sellerPhone ? (
                                  <a
                                    href={`https://wa.me/${sellerPhone
                                      .replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-accent btn-sm"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <Phone size={16} />
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
                                  className="btn btn-text text-text-tertiary hover:text-error"
                                  title="Signaler"
                                >
                                  <Flag size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between pt-8 border-t border-border-color">
                    <button
                      className="btn btn-secondary"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      ← Précédent
                    </button>

                    <span className="text-sm text-text-secondary font-medium">
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
              <div className="card">
                <div className="card-body text-center py-16">
                  <Search size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-secondary mb-2">
                    Aucune annonce trouvée
                  </h3>
                  <p className="text-text-tertiary mb-6">
                    Aucune annonce ne correspond à vos critères de recherche.
                  </p>
                  <button onClick={clearFilters} className="btn btn-primary">
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;