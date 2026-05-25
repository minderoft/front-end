import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Zap, Building2, Truck, HardHat, Wrench } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'LocaPlus - La marketplace sécurisée en Côte d\'Ivoire';
  }, []);

  const categories = [
    { id: 'immobilier', name: 'Immobilier', icon: Building2 },
    { id: 'vehicule', name: 'Véhicules', icon: Truck },
    { id: 'materiaux', name: 'Matériaux de construction', icon: HardHat },
    { id: 'technicien', name: 'Techniciens', icon: Wrench },
  ];

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
    </div>
  );
};

export default Home;
