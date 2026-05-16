// filepath: front-end/src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { announcementService } from '../services/api';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';

const categories = [
  { id: 'immobilier', name: 'Immobilier', icon: '🏠', description: 'Terrains, villas, appartements', theme: 'immobilier' },
  { id: 'vehicule', name: 'Véhicules', icon: '🚗', description: 'Voitures, motos, trucks', theme: 'vehicule' },
  { id: 'materiaux', name: 'BTP', icon: '🧱', description: 'Matériaux et fournitures', theme: 'materiaux' },
  { id: 'technicien', name: 'Techniciens', icon: '🔧', description: 'Plombiers, électriciens, maçons', theme: 'technicien' },
];

const professionalPricing = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: '🏠',
    price: 5000,
    details: 'Annonce 30 jours · Visibilité standard',
    buttonLabel: 'Publier dans Immobilier',
  },
  {
    id: 'materiaux',
    name: 'Matériaux',
    icon: '🧱',
    price: 3000,
    details: 'Annonce 30 jours · Visibilité standard',
    buttonLabel: 'Publier dans Matériaux',
  },
  {
    id: 'technicien',
    name: 'Technicien',
    icon: '🔧',
    price: 2000,
    details: 'Annonce 30 jours',
    buttonLabel: 'Publier dans Technicien',
  },
  {
    id: 'vehicule',
    name: 'Véhicule',
    icon: '🚗',
    price: 4000,
    details: 'Annonce 30 jours',
    buttonLabel: 'Publier dans Véhicule',
  },
];

const securityFeatures = [
  {
    title: 'Données chiffrées',
    description: 'Toutes les conversations et les paiements sont protégés par SSL et chiffrement de bout en bout.',
    icon: '🔒',
  },
  {
    title: 'Vérification RSI',
    description: 'Vendeurs qualifiés et vérifiés pour renforcer la confiance sur chaque transaction.',
    icon: '✅',
  },
  {
    title: 'Paiement sécurisé',
    description: 'Intégration Paystack/Djamo pour des transactions fluides et sûres.',
    icon: '💳',
  },
];

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyAnnouncements, setNearbyAnnouncements] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const announcementsRes = await announcementService.getAll({ limit: 6 });
        setAnnouncements(Array.isArray(announcementsRes.data.announcements) ? announcementsRes.data.announcements : []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNearbySearch = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée par votre navigateur');
      return;
    }

    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await announcementService.getNearby(latitude, longitude);
          setNearbyAnnouncements(response.data.announcements);
        } catch (error) {
          console.error('Erreur recherche nearby:', error);
          alert('Erreur lors de la recherche des annonces proches');
        } finally {
          setNearbyLoading(false);
        }
      },
      () => {
        alert('Impossible d\'accéder à votre position. Veuillez vérifier vos paramètres.');
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
            <span className="hero-eyebrow">Fintech + Sécurité · Présence Abidjan</span>
            <h1>LocaPlus, la marketplace sécurisée pour l’immobilier, véhicules, BTP et techniciens.</h1>
            <p>
              Une expérience professionnelle, visuelle et ultra fiable pour publier ou chercher des annonces à Abidjan. Données chiffrées, vendeurs vérifiés et paiement sécurisé à portée de main.
            </p>
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
            <div className="hero-panel-card">
              <div className="hero-panel-head">
                <span>Performance</span>
                <strong>+ 1,200 annonces actives</strong>
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
            </div>
            <div className="hero-panel-card hero-panel-card-secondary">
              <h3>Décollage instantané</h3>
              <p>Publiez votre première annonce en moins de 5 minutes et atteignez rapidement vos clients.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ecosystem-section">
        <div className="section-head">
          <span className="section-label">Explorez notre Écosystème</span>
          <h2>Navigation visuelle par catégorie</h2>
        </div>
        <div className="ecosystem-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`ecosystem-card ${category.theme}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="ecosystem-card-overlay" />
              <div className="ecosystem-card-content">
                <span className="ecosystem-icon">{category.icon}</span>
                <h3>{category.name}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

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
            {nearbyLoading ? 'Localisation en cours...' : '📍 Autour de moi (10km)'}
          </button>
        </div>

        {nearbyAnnouncements && (
          <>
            {nearbyAnnouncements.length > 0 ? (
              <>
                <p className="text-muted mb-4">
                  {nearbyAnnouncements.length} annonce{nearbyAnnouncements.length > 1 ? 's' : ''} trouvée{nearbyAnnouncements.length > 1 ? 's' : ''} autour de vous
                </p>
                <div className="announcements-grid">
                  {nearbyAnnouncements.map((announcement) => {
                    const parsedImages = parseImages(announcement.images);
                    const rawImage = announcement.image_url || parsedImages[0];
                    const imageUrl = resolveImageUrl(rawImage);

                    return (
                      <article key={announcement.id} className="card announcement-card">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={announcement.title}
                            className="card-image"
                            loading="lazy"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="card-image card-image-fallback">🏠</div>
                        )}
                        <div className="card-body">
                          <span className="card-tag">{announcement.category}</span>
                          <h3 className="card-title">{announcement.title}</h3>
                          <p className="card-text">{announcement.description?.substring(0, 100)}...</p>
                          <div className="card-price">{announcement.price?.toLocaleString()} FCFA</div>
                          <div className="card-meta">
                            <span>📍 {announcement.location}</span>
                            {announcement.distance_km && <span>📏 {announcement.distance_km.toFixed(1)}km</span>}
                          </div>
                          <div className="card-actions">
                            <button
                              type="button"
                              onClick={() => navigate(`/announcements/${announcement.id}`)}
                              className="btn btn-outline"
                            >
                              Voir
                            </button>
                            <a
                              href={`https://wa.me/${announcement.user_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis LocaPlus pour votre annonce : ${announcement.title}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-whatsapp"
                            >
                              💬 WhatsApp
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Aucune annonce à proximité. Élargissez votre recherche !</p>
              </div>
            )}
          </>
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
            <article key={plan.id} className="card pricing-card">
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
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : announcements.length > 0 ? (
          <div className="announcements-grid">
            {announcements.map((announcement) => {
              const parsedImages = parseImages(announcement.images);
              const imageUrl = resolveImageUrl(parsedImages[0]);

              return (
                <article key={announcement.id} className="card announcement-card">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={announcement.title}
                      className="card-image"
                      loading="lazy"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="card-image card-image-fallback">🏠</div>
                  )}
                  <div className="card-body">
                    <span className="card-tag">{announcement.category}</span>
                    <h3 className="card-title">{announcement.title}</h3>
                    <p className="card-text">{announcement.description?.substring(0, 100)}...</p>
                    <div className="card-price">{announcement.price?.toLocaleString()} FCFA</div>
                    <div className="card-meta">
                      <span>📍 {announcement.location}</span>
                    </div>
                    <div className="card-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/announcements/${announcement.id}`)}
                        className="btn btn-outline"
                      >
                        Voir
                      </button>
                      <a
                        href={`https://wa.me/${announcement.user_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis LocaPlus pour votre annonce : ${announcement.title}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-whatsapp"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
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
          <p>Rejoignez LocaPlus et atteignez des milliers de clients potentiels avec une publication sécurisée.</p>
        </div>
        <Link to="/register" className="btn btn-primary btn-lg">
          Créer un compte gratuitement
        </Link>
      </section>
    </div>
  );
};

export default Home;