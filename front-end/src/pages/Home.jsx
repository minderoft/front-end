// filepath: front-end/src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { announcementService, pricingService } from '../services/api';

const categories = [
  { id: 'immobilier', name: 'Immobilier', icon: '🏠', description: 'Terrains, villas, appartements' },
  { id: 'vehicule', name: 'Véhicules', icon: '🚗', description: 'Voitures, motos, trucks' },
  { id: 'materiaux', name: 'Matériaux', icon: '🧱', description: 'Ciment, sable, fer, briques' },
  { id: 'technicien', name: 'Techniciens', icon: '🔧', description: 'Plombiers, électriciens, maçons' },
];

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pricingLoading, setPricingLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [announcementsRes, pricingRes] = await Promise.all([
          announcementService.getAll({ limit: 6 }),
          pricingService.getAll()
        ]);
        setAnnouncements(announcementsRes.data.announcements);
        setPricing(pricingRes.data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
        setPricingLoading(false);
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
      <section className="announcements-section" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="announcements-header">
          <h2>Tarifs de Publication</h2>
          <Link to="/create" className="btn btn-primary">
            Publier maintenant
          </Link>
        </div>
        
        {pricingLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : pricing ? (
          <div className="pricing-grid">
            {pricing.categories.map((cat) => (
              <div key={cat.id} className="card pricing-card">
                <div className="pricing-header">
                  <span className="pricing-icon">
                    {categories.find(c => c.id === cat.id)?.icon || '📋'}
                  </span>
                  <h3>{cat.name}</h3>
                </div>
                <div className="pricing-price">
                  <span className="price-amount">{cat.price.toLocaleString()}</span>
                  <span className="price-currency">FCFA</span>
                  <span className="price-period">/publication</span>
                </div>
                <p className="pricing-description">{cat.description}</p>
                <ul className="pricing-features">
                  {cat.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
                <Link to={`/create?category=${cat.id}`} className="btn btn-outline" style={{ width: '100%' }}>
                  Publier dans {cat.name}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted">Tarifs non disponibles</p>
        )}
        
        <div className="text-center mt-4">
          <p className="text-muted">
            💳 Paiement sécurisé par Wave, Orange Money, MTN, Moov ou carte bancaire
          </p>
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