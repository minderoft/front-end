// filepath: front-end/src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { announcementService } from '../services/api';

const categories = [
  { id: 'immobilier', name: 'Immobilier', icon: '🏠', description: 'Terrains, villas, appartements' },
  { id: 'vehicule', name: 'Véhicules', icon: '🚗', description: 'Voitures, motos, trucks' },
  { id: 'materiaux', name: 'Matériaux', icon: '🧱', description: 'Ciment, sable, fer, briques' },
  { id: 'technicien', name: 'Techniciens', icon: '🔧', description: 'Plombiers, électriciens, maçons' },
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

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const announcementsRes = await announcementService.getAll({ limit: 6 });
        setAnnouncements(announcementsRes.data.announcements);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCategoryClick = (categoryId) => {
    navigate(`/announcements?category=${categoryId}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>LocaPlus - Votre Plateforme Multi-Services</h1>
          <p>
            Trouvez ce dont vous avez besoin ou proposez vos services. 
            Immobilier, véhicules, matériaux de construction et techniciens qualifiés.
          </p>
          <div className="hero-buttons">
            <Link to="/announcements" className="btn btn-accent btn-lg">
              Voir les annonces
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>
              Publier une annonce
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories">
        <h2 className="text-center">Nos Catégories</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="category-card"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tarifs de publication */}
      <section className="announcements-section">
        <div className="announcements-header">
          <div>
            <h2>Tarifs professionnels</h2>
            <p className="text-muted" style={{ marginTop: '8px' }}>
              Découvrez nos tarifs de publication simples et transparents pour chaque catégorie.
            </p>
          </div>
          <Link to="/create" className="btn btn-primary">
            Publier maintenant
          </Link>
        </div>

        <div className="pricing-grid">
          {professionalPricing.map((plan) => (
            <div key={plan.id} className="card pricing-card">
              <div className="pricing-header">
                <span className="pricing-icon">{plan.icon}</span>
                <h3>{plan.name}</h3>
              </div>
              <div className="pricing-price">
                <span className="price-amount">{plan.price.toLocaleString()}</span>
                <span className="price-currency">FCFA</span>
                <span className="price-period">/publication</span>
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
                style={{ width: '100%' }}
              >
                {plan.buttonLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Announcements */}
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
            {announcements.map((announcement) => (
              <Link 
                to={`/announcements/${announcement.id}`} 
                key={announcement.id}
                className="card"
              >
                {announcement.images && announcement.images.length > 0 ? (
                  <img 
                    src={announcement.images[0]} 
                    alt={announcement.title}
                    className="card-image"
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
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  }}>
                    {announcement.category}
                  </span>
                  <h3 className="card-title">{announcement.title}</h3>
                  <p className="card-text">{announcement.description?.substring(0, 100)}...</p>
                  <div className="card-price">{announcement.price?.toLocaleString()} FCFA</div>
                  <div className="card-meta">
                    <span>📍 {announcement.location}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center" style={{ padding: '48px' }}>
            <p className="text-muted">Aucune annonce pour le moment. Soyez le premier à publier !</p>
            <Link to="/create" className="btn btn-primary mt-3">
              Publier une annonce
            </Link>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section style={{ 
        backgroundColor: 'var(--primary)', 
        padding: '64px 24px', 
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ color: 'white', marginBottom: '16px' }}>
          Vous êtes professionnel ?
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.9 }}>
          Rejoignez LocaPlus et atteignez des milliers de clients potentiels.
        </p>
        <Link to="/register" className="btn btn-accent btn-lg">
          Créer un compte gratuitement
        </Link>
      </section>
    </div>
  );
};

export default Home;