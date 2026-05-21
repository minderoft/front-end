// filepath: front-end/src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { announcementService } from '../services/api';
import AdCard from '../components/AdCard';
import CategoryCarousel from '../components/CategoryCarousel';
import { Home as HomeIcon, Car, HardHat, Wrench, Shield, CheckCircle, CreditCard, MapPin, Sparkles } from 'lucide-react';

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

const categories = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: <HomeIcon size={28} />,
    description: 'Maisons, appartements, terrains',
    theme: 'immobilier',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'vehicule',
    name: 'Véhicules',
    icon: <Car size={28} />,
    description: 'Voitures, motos et utilitaires',
    theme: 'vehicule',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'materiaux',
    name: 'BTP',
    icon: <HardHat size={28} />,
    description: 'Matériaux et équipements de construction',
    theme: 'materiaux',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'technicien',
    name: 'Techniciens',
    icon: <Wrench size={28} />,
    description: 'Artisans, serruriers, électriciens, plombiers',
    theme: 'technicien',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1050&q=80',
  },
];

const professionalPricing = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: <HomeIcon size={24} />,
    price: 5000,
    details: 'Annonce 30 jours · Visibilité standard',
    buttonLabel: 'Publier dans Immobilier',
    popular: true,
  },
  {
    id: 'materiaux',
    name: 'Matériaux',
    icon: <HardHat size={24} />,
    price: 3000,
    details: 'Annonce 30 jours · Visibilité standard',
    buttonLabel: 'Publier dans Matériaux',
  },
  {
    id: 'technicien',
    name: 'Technicien',
    icon: <Wrench size={24} />,
    price: 2000,
    details: 'Annonce 30 jours',
    buttonLabel: 'Publier dans Technicien',
  },
  {
    id: 'vehicule',
    name: 'Véhicule',
    icon: <Car size={24} />,
    price: 4000,
    details: 'Annonce 30 jours',
    buttonLabel: 'Publier dans Véhicule',
  },
];

const securityFeatures = [
  {
    title: 'Données chiffrées',
    description: 'Toutes les conversations et les paiements sont protégés par SSL et chiffrement de bout en bout.',
    icon: <Shield size={28} />,
  },
  {
    title: 'Vérification RSI',
    description: 'Vendeurs qualifiés et vérifiés pour renforcer la confiance sur chaque transaction.',
    icon: <CheckCircle size={28} />,
  },
  {
    title: 'Paiement sécurisé',
    description: 'Intégration Paystack/Djamo pour des transactions fluides et sûres.',
    icon: <CreditCard size={28} />,
  },
];

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homeError, setHomeError] = useState('');
  const [recentTotal, setRecentTotal] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyAnnouncements, setNearbyAnnouncements] = useState([]);
  const [nearbyError, setNearbyError] = useState('');
  const [nearbySearched, setNearbySearched] = useState(false);
  const [recommendedAds, setRecommendedAds] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [recommendedError, setRecommendedError] = useState('');
  const navigate = useNavigate();

  const fetchRecentAnnouncements = async () => {
    setLoading(true);
    setHomeError('');
    try {
      const announcementsRes = await announcementService.getPublicAll({ limit: 6, page: 1 });
      const results = announcementsRes.data?.announcements ?? [];
      const total = Number(announcementsRes.data?.pagination?.total);
      if (import.meta.env.DEV) {
        console.log('DEBUG Home.jsx - Annonces chargées:', results.length, results);
      }
      setAnnouncements(Array.isArray(results) ? results : []);
      setRecentTotal(Number.isFinite(total) ? total : null);
    } catch (error) {
      console.error('Erreur chargement annonces Home:', error);
      setAnnouncements([]);
      setRecentTotal(null);
      setHomeError('Impossible de charger les annonces récentes. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageMeta('LocaPlus - Annonces immobilières, BTP, véhicules et techniciens', 'Découvrez les annonces professionnelles en immobilier, véhicules, matériaux et services techniques sur LocaPlus.');
    // Ensure any unexpected rejection doesn't keep the UI loading forever
    fetchRecentAnnouncements().catch((err) => {
      console.error('Unhandled error in fetchRecentAnnouncements:', err);
      setLoading(false);
      setHomeError('Impossible de charger les annonces récentes.');
    });
    // Fetch recommended sponsored ads
    fetchRecommended();
  }, []);

  const fetchRecommended = async () => {
    setRecommendedLoading(true);
    setRecommendedError('');
    try {
      const recentCategory = localStorage.getItem('recentCategory') || '';
      const params = {};
      if (recentCategory) params.targetCategory = recentCategory;
      const res = await announcementService.getSponsored(params);
      const rows = res.data?.announcements ?? [];
      setRecommendedAds(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error('Erreur fetch recommended:', err);
      setRecommendedError('Impossible de charger les recommandations pour vous.');
      setRecommendedAds([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  const handleNearbySearch = () => {
    setNearbyError('');
    setNearbySearched(true);
    if (!navigator.geolocation) {
      setNearbyError('Géolocalisation non supportée par votre navigateur.');
      return;
    }

    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await announcementService.getNearby(latitude, longitude);
          const nearbyResults = response.data?.announcements ?? [];
          if (import.meta.env.DEV) {
            console.log('DEBUG Annonces proches chargées:', nearbyResults.length, nearbyResults);
          }
          setNearbyAnnouncements(Array.isArray(nearbyResults) ? nearbyResults : []);
        } catch (error) {
          console.error('Erreur recherche nearby:', error);
          setNearbyError('Impossible de charger les annonces proches. Réessayez.');
          setNearbyAnnouncements([]);
        } finally {
          setNearbyLoading(false);
        }
      },
      () => {
        setNearbyError('Impossible d\'accéder à votre position. Veuillez vérifier vos paramètres.');
        setNearbyLoading(false);
      }
    );
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/announcements?category=${categoryId}`);
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">Fintech + Sécurité</span>
            <h1>LocaPlus, la marketplace sécurisée pour vos services.</h1>
            <p>Immobilier, véhicules, BTP, techniciens — vendeurs vérifiés, paiement Paystack/Djamo.</p>
            <div className="hero-buttons">
              <Link to="/announcements" className="btn btn-primary btn-lg">
                Explorer les annonces
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Publier une annonce
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-card h-fit">
              <div className="hero-panel-head">
                <span>Performance</span>
                <strong>{recentTotal !== null ? `${recentTotal.toLocaleString()} annonces actives` : 'Annonces en cours...'}</strong>
              </div>
              <div className="hero-metrics">
                <div>
                  <strong>4 catégories</strong>
                  <p>Immobilier, Véhicules, BTP, Techniciens</p>
                </div>
                <div>
                  <strong>100% sécurisé</strong>
                  <p>Paiement Paystack/Djamo</p>
                </div>
              </div>
              <div className="hero-stats-grid">
                <div>
                  <strong>12 annonces</strong>
                  <p>actives ce mois</p>
                </div>
                <div>
                  <strong>1 200+</strong>
                  <p>utilisateurs actifs</p>
                </div>
                <div>
                  <strong>8 pays</strong>
                  <p>couvert par la plateforme</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="announcements-section">
        <div className="announcements-header">
          <h2>🚀 Recommandé pour vous</h2>
          <button onClick={fetchRecommended} className="btn btn-outline">Actualiser</button>
        </div>

        {recommendedLoading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ width: 300, marginRight: 12 }} />
            ))}
          </div>
        ) : recommendedAds.length > 0 ? (
          <div className="recommended-slider" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
            {recommendedAds.map((announcement) => (
              <div key={announcement.id} style={{ minWidth: 300 }}>
                <AdCard announcement={announcement} onBoost={() => navigate(`/announcements/${announcement.id}`)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: 40, color: 'var(--muted)', marginBottom: 12 }} aria-hidden>
              <Sparkles />
            </div>
            <p className="text-muted">Aucune recommandation pour le moment.</p>
            <Link to="/announcements" className="btn btn-primary mt-3">Explorer les annonces</Link>
          </div>
        )}

      </section>

      <CategoryCarousel categories={categories} onCategoryClick={handleCategoryClick} />

      <section className="security-trust">
        <div className="section-head">
          <span className="section-label">Sécurité certifiée</span>
          <h2>Notre ADN : confiance, sécurité et transparence.</h2>
        </div>
        <div className="trust-grid">
          {securityFeatures.map((feature) => (
            <article key={feature.title} className="trust-card">
              <div className="trust-icon">{feature.icon}</div>
              <div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="announcements-section">
        <div className="announcements-header">
          <h2>Chercher autour de vous</h2>
          <button
            onClick={handleNearbySearch}
            disabled={nearbyLoading}
            className="btn btn-primary"
          >
            {nearbyLoading ? 'Localisation en cours...' : (<><MapPin size={16} style={{ marginRight: 6 }} />Autour de moi (10km)</>)}
          </button>
        </div>

        {nearbyError && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <p>{nearbyError}</p>
          </div>
        )}

        {nearbyLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : nearbySearched ? (
          <>
            {nearbyAnnouncements.length > 0 ? (
              <>
                <p className="text-muted mb-4">
                  {nearbyAnnouncements.length} annonce{nearbyAnnouncements.length > 1 ? 's' : ''} trouvée{nearbyAnnouncements.length > 1 ? 's' : ''} autour de vous
                </p>
                <div className="announcements-grid">
                  {nearbyAnnouncements.map((announcement) => (
                    <AdCard key={announcement.id} announcement={announcement} onBoost={() => navigate(`/announcements/${announcement.id}`)} />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Aucune annonce à proximité. Élargissez votre recherche !</p>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>Appuyez sur « Autour de moi » pour découvrir les annonces proches de votre position.</p>
          </div>
        )}
      </section>

      <section className="announcements-section">
        <div className="announcements-header">
          <div>
            <h2>Tarifs professionnels</h2>
            <p className="text-muted">Découvrez nos tarifs de publication simples et transparents pour chaque catégorie.</p>
          </div>
          <Link to="/create" className="btn btn-primary">
            Publier maintenant
          </Link>
        </div>

        <div className="pricing-grid">
          {professionalPricing.map((plan) => (
            <article key={plan.id} className={`card pricing-card relative ${plan.id === 'immobilier' ? 'border-2 border-orange-500 scale-105 shadow-xl' : 'border'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
                  Populaire
                </span>
              )}
              <div className="pricing-header">
                <span className="pricing-icon">{plan.icon}</span>
                <h3>{plan.name}</h3>
              </div>
              <div className="pricing-price">
                <span className="price-amount">{plan.price.toLocaleString()}</span>
                <span className="price-currency">FCFA</span>
              </div>
              <p className="pricing-description">{plan.details}</p>
              <ul className="pricing-features">
                {plan.details.split(' · ').map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <Link
                to={`/create?category=${plan.id}`}
                className="btn btn-outline"
              >
                {plan.buttonLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="announcements-section">
        <div className="announcements-header">
          <h2>Annonces Récentes</h2>
          <Link to="/announcements" className="btn btn-outline">
            Voir tout
          </Link>
        </div>

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
        ) : homeError ? (
          <div className="alert alert-error">
            <p>{homeError}</p>
            <button onClick={fetchRecentAnnouncements} className="btn btn-primary" type="button">
              Réessayer
            </button>
          </div>
        ) : announcements.length > 0 ? (
          <div className="announcements-grid">
            {announcements.map((announcement) => (
                <AdCard key={announcement._id || announcement.id || announcement.title} announcement={announcement} onBoost={() => navigate(`/announcements/${announcement._id || announcement.id}`)} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Aucune annonce pour le moment. Soyez le premier à publier !</p>
            <Link to="/create" className="btn btn-primary mt-3">
              Publier une annonce
            </Link>
          </div>
        )}
      </section>

      <section className="cta-banner">
        <div className="cta-copy">
          <h2>Vous êtes professionnel ?</h2>
          <p className="text-white/90">Rejoignez LocaPlus et atteignez des milliers de clients potentiels avec une publication sécurisée.</p>
        </div>
        <Link to="/register" className="btn btn-primary btn-lg">
          Créer un compte gratuitement
        </Link>
      </section>
    </div>
  );
};

export default Home;