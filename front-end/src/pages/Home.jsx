import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  Lock,
  MapPin,
  ArrowRight,
  Star,
  Wrench,
  Car,
  HardHat,
  Home as HomeIcon,
  Zap,
  TrendingUp,
  Users,
  Award,
  Upload,
  Lock as LockIcon,
  CreditCard,
} from 'lucide-react';
import Button from '../components/Button';
import Card, { CardImage, CardBody } from '../components/Card';
import SearchBar from '../components/SearchBar';
import './Home.css';

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
    icon: HomeIcon,
    count: 142,
  },
  {
    id: 'vehicule',
    name: 'Véhicules',
    icon: Car,
    count: 89,
  },
  {
    id: 'materiaux',
    name: 'Matériaux BTP',
    icon: HardHat,
    count: 56,
  },
  {
    id: 'technicien',
    name: 'Techniciens',
    icon: Wrench,
    count: 34,
  },
  {
    id: 'services',
    name: 'Services',
    icon: Award,
    count: 78,
  },
];

// Annonces réalistes avec images cohérentes
const mockAnnouncements = [
  {
    id: 1,
    title: 'Villa moderne à Cocody - 4 chambres',
    description: 'Magnifique villa contemporaine avec piscine, jardin et parking sécurisé',
    price: '45,000,000',
    currency: 'FCFA',
    location: 'Cocody, Abidjan',
    category: 'immobilier',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80',
    verified: true,
    featured: true,
  },
  {
    id: 2,
    title: 'Toyota RAV4 2020 - État excellent',
    description: 'SUV compact fiable, full options, première main, entretien régulier',
    price: '12,500,000',
    currency: 'FCFA',
    location: 'Treichville, Abidjan',
    category: 'vehicule',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=500&q=80',
    verified: true,
    featured: true,
  },
  {
    id: 3,
    title: 'Ciment Portland 50kg - Lot de 100 sacs',
    description: 'Matériau de construction de qualité premium pour tous vos projets BTP',
    price: '6,500',
    currency: 'FCFA/sac',
    location: 'Yopougon, Abidjan',
    category: 'materiaux',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=500&q=80',
    verified: false,
    featured: false,
  },
  {
    id: 4,
    title: 'Électricien professionnel - Installation & Réparation',
    description: 'Services électriques résidentiels et commerciaux. Travaux garantis, délai rapide',
    price: 'Sur devis',
    currency: '',
    location: 'Plateau, Abidjan',
    category: 'technicien',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=500&q=80',
    verified: true,
    featured: false,
  },
  {
    id: 5,
    title: 'Appartement F3 lumineux à proximité du marché',
    description: 'Bien immobilier rénové, lumineux, proche des commerces et transports',
    price: '350,000',
    currency: 'FCFA/mois',
    location: 'Marcory, Abidjan',
    category: 'immobilier',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80',
    verified: true,
    featured: false,
  },
  {
    id: 6,
    title: 'Mercedes C300 2019 - Berline premium',
    description: 'Automobile de prestige, cuir noir, toit ouvrant, faible kilométrage',
    price: '18,000,000',
    currency: 'FCFA',
    location: 'Koumassi, Abidjan',
    category: 'vehicule',
    image: 'https://images.unsplash.com/photo-1554744512-d2c1221a6101?auto=format&fit=crop&w=500&q=80',
    verified: true,
    featured: false,
  },
];

const kpis = [
  {
    icon: Users,
    label: 'Utilisateurs actifs',
    value: '8,500+',
  },
  {
    icon: CheckCircle,
    label: 'Vendeurs vérifiés',
    value: '1,200+',
  },
  {
    icon: CreditCard,
    label: 'Transactions sécurisées',
    value: '15,000+',
  },
  {
    icon: TrendingUp,
    label: 'Taux de satisfaction',
    value: '98%',
  },
];

const steps = [
  {
    number: 1,
    title: 'Créer votre annonce',
    description: 'Publiez votre bien ou service en 5 minutes. Ajoutez photos, prix et détails',
    icon: Upload,
  },
  {
    number: 2,
    title: 'Échanger en sécurité',
    description: 'Communiquez directement avec les acheteurs via notre système de messagerie',
    icon: LockIcon,
  },
  {
    number: 3,
    title: 'Payer via Paystack ou Djamo',
    description: 'Transactions garanties avec nos partenaires de paiement sécurisés',
    icon: CreditCard,
  },
];

const CategoryCard = ({ category, onNavigate }) => {
  const Icon = category.icon;
  return (
    <button
      onClick={() => onNavigate(`/announcements?category=${category.id}`)}
      className="category-card"
    >
      <div className="category-icon-wrapper">
        <Icon className="category-icon" />
      </div>
      <h3 className="category-name">{category.name}</h3>
      <p className="category-count">{category.count} annonces</p>
      <ArrowRight className="category-arrow" />
    </button>
  );
};

const AnnouncementCard = ({ announcement, onNavigate }) => {
  return (
    <button
      onClick={() => onNavigate(`/announcements/${announcement.id}`)}
      className="announcement-card"
    >
      <CardImage src={announcement.image} alt={announcement.title} />
      
      {announcement.featured && (
        <div className="card-badge card-badge-featured">
          <Star size={12} fill="currentColor" />
          En vedette
        </div>
      )}
      {announcement.verified && (
        <div className="card-badge card-badge-verified">
          <CheckCircle size={12} />
          Vérifié
        </div>
      )}

      <CardBody>
        <span className="announcement-category">{announcement.category}</span>
        <h3 className="announcement-title">{announcement.title}</h3>
        <p className="announcement-description">{announcement.description}</p>

        <div className="announcement-location">
          <MapPin size={16} />
          <span>{announcement.location}</span>
        </div>

        <div className="announcement-footer">
          <div className="announcement-price">
            {announcement.price}
            {announcement.currency && (
              <span className="announcement-currency">{announcement.currency}</span>
            )}
          </div>
        </div>
      </CardBody>
    </button>
  );
};

const KPICard = ({ icon: Icon, label, value }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-icon">
        <Icon size={28} />
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
};

const StepCard = ({ step, index }) => {
  const Icon = step.icon;
  return (
    <div className="step-card">
      <div className="step-number">{step.number}</div>
      <div className="step-icon">
        <Icon size={32} />
      </div>
      <h3 className="step-title">{step.title}</h3>
      <p className="step-description">{step.description}</p>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta(
      'LocaPlus - Marketplace sécurisée pour immobilier, véhicules & services',
      'LocaPlus : immobilier, véhicules, BTP, techniciens. Vendeurs vérifiés, paiement sécurisé Paystack/Djamo.'
    );

    const fetchRecentAnnouncements = async () => {
      setLoading(false);
      setAnnouncements(mockAnnouncements);
    };

    fetchRecentAnnouncements();
  }, []);

  const handleSearch = ({ keyword, location, category }) => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    if (category) params.append('category', category);
    navigate(`/announcements?${params.toString()}`);
  };

  return (
    <div className="home-container">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Découvrez l'immobilier, les véhicules et services de qualité en Côte d'Ivoire
            </h1>
            <p className="hero-subtitle">
              La marketplace sécurisée pour vendre, acheter et louer. Vendeurs vérifiés, paiement garanti.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="hero-badges">
            <div className="badge">
              <Shield size={18} />
              <span>Paiement sécurisé Paystack & Djamo</span>
            </div>
            <div className="badge">
              <CheckCircle size={18} />
              <span>Vendeurs vérifiés</span>
            </div>
            <div className="badge">
              <Lock size={18} />
              <span>Support 7j/7</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hero-search">
            <SearchBar categories={categories} onSearch={handleSearch} />
          </div>

          {/* CTA Buttons */}
          <div className="hero-cta">
            <Button
              variant="cta"
              size="lg"
              onClick={() => navigate('/announcements')}
            >
              Explorer les annonces
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Publier une annonce
            </Button>
          </div>
        </div>
      </section>

      {/* ===== KPIs SECTION ===== */}
      <section className="kpi-section">
        <div className="section-container">
          <h2 className="section-title">Nos performances</h2>
          <div className="kpi-grid">
            {kpis.map((kpi) => (
              <KPICard key={kpi.label} {...kpi} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES SECTION ===== */}
      <section className="categories-section">
        <div className="section-container">
          <h2 className="section-title">Explorez par catégorie</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onNavigate={navigate}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== RECENT ANNOUNCEMENTS SECTION ===== */}
      <section className="announcements-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Annonces récentes</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/announcements')}
            >
              Voir toutes les annonces
              <ArrowRight size={18} />
            </Button>
          </div>

          {loading ? (
            <div className="announcements-loading">Chargement...</div>
          ) : (
            <div className="announcements-grid">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onNavigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">Comment ça marche</h2>
          <p className="section-subtitle">
            Trois étapes simples pour vendre, acheter ou trouver les services que vous cherchez
          </p>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <StepCard key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROFESSIONAL CTA SECTION ===== */}
      <section className="professional-cta-section">
        <div className="section-container">
          <div className="professional-cta">
            <div className="professional-content">
              <h2 className="professional-title">
                Vous êtes professionnel ?
              </h2>
              <p className="professional-subtitle">
                Rejoignez nos vendeurs professionnels et augmentez votre visibilité
              </p>
              <ul className="professional-benefits">
                <li>Paiement garanti et sécurisé</li>
                <li>Tableau de bord exclusif et analytique</li>
                <li>Visibilité prioritaire sur la marketplace</li>
                <li>Support client dédié</li>
              </ul>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/register')}
              >
                Créer un compte professionnel
              </Button>
            </div>
            <div className="professional-image">
              <div className="professional-image-placeholder">
                <Zap size={48} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
