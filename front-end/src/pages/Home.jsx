import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  Lock,
  MapPin,
  Sparkles,
  TrendingUp,
  Plus,
  ArrowRight,
  Award,
  ChevronRight,
  Star,
  Wrench,
  Car,
  HardHat,
} from 'lucide-react';

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

// Categories data with images
const categories = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    description: 'Maisons, appartements, terrains',
    icon: Shield,
    color: 'primary',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'vehicule',
    name: 'Véhicules',
    description: 'Voitures, motos, utilitaires',
    icon: Car,
    color: 'accent',
    image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'materiaux',
    name: 'Matériaux BTP',
    description: 'Matériaux et équipements',
    icon: HardHat,
    color: 'primary',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'technicien',
    name: 'Techniciens',
    description: 'Artisans, électriciens, plombiers',
    icon: Wrench,
    color: 'accent',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80',
  },
];

// Trust features
const trustFeatures = [
  {
    icon: Shield,
    title: 'Paiements Sécurisés',
    description: 'Transactions protégées avec Paystack et Djamo pour votre tranquillité',
  },
  {
    icon: CheckCircle,
    title: 'Vendeurs Vérifiés',
    description: 'Tous nos vendeurs sont validés et certifiés pour garantir la qualité',
  },
  {
    icon: Lock,
    title: 'Données Chiffrées',
    description: 'Vos conversations et données sont protégées par SSL de bout en bout',
  },
];

// Mock announcements (fallback if API down)
const mockAnnouncements = [
  {
    id: 1,
    title: 'Villa moderne à Cocody',
    description: 'Magnifique villa de 4 chambres avec piscine et jardin arboré',
    price: '45,000,000',
    currency: 'FCFA',
    location: 'Cocody, Abidjan',
    category: 'immobilier',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1229c5?auto=format&fit=crop&w=500&q=80',
    verified: true,
    featured: true,
  },
  {
    id: 2,
    title: 'Toyota RAV4 2020',
    description: 'SUV impeccable, full options, première main, entretien régulier',
    price: '12,500,000',
    currency: 'FCFA',
    location: 'Treichville, Abidjan',
    category: 'vehicule',
    image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=500&q=80',
    verified: true,
    featured: true,
  },
  {
    id: 3,
    title: 'Ciment Portland 50kg',
    description: 'Lot de 100 sacs de ciment Portland de haute qualité',
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
    title: 'Électricien professionnel',
    description: 'Installation, rénovation et dépannage électrique résidentiel',
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
    title: 'Appartement F3 à louer',
    description: 'Bel appartement F3 lumineux, proche des commerces',
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
    title: 'Mercedes C300 2019',
    description: 'Berline premium, cuir noir, toit ouvrant, faible kilométrage',
    price: '18,000,000',
    currency: 'FCFA',
    location: 'Koumassi, Abidjan',
    category: 'vehicule',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=500&q=80',
    verified: true,
    featured: false,
  },
];

// AnnouncementCard Component
const AnnouncementCard = ({ announcement, onNavigate }) => {
  return (
    <div 
      className="card bg-white overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
      onClick={() => onNavigate(`/announcements/${announcement.id}`)}
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img 
          src={announcement.image} 
          alt={announcement.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {announcement.featured && (
          <div className="absolute top-3 right-3">
            <span className="badge badge-accent">
              <Star size={12} />
              En vedette
            </span>
          </div>
        )}
        {announcement.verified && (
          <div className="absolute top-3 left-3">
            <div className="bg-success bg-opacity-90 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle size={14} />
              Vérifié
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category Badge */}
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
          {announcement.category}
        </span>

        {/* Title */}
        <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {announcement.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-tertiary mb-4 line-clamp-2">
          {announcement.description}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-text-tertiary mb-4">
          <MapPin size={16} className="flex-shrink-0" />
          <span>{announcement.location}</span>
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-border-color">
          <div className="text-xl font-bold text-accent">
            {announcement.price}
            {announcement.currency && <span className="text-sm font-medium text-text-secondary ml-1">{announcement.currency}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// CategoryCard Component
const CategoryCard = ({ category, onNavigate }) => {
  const Icon = category.icon;
  
  return (
    <div 
      className="group cursor-pointer"
      onClick={() => onNavigate(`/announcements?category=${category.id}`)}
    >
      <div className="relative h-48 overflow-hidden rounded-2xl mb-4 bg-slate-100">
        <img 
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-40 group-hover:opacity-50 transition-opacity" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-primary group-hover:text-accent transition-colors" />
          <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
            {category.name}
          </h3>
        </div>
        <p className="text-sm text-text-tertiary">
          {category.description}
        </p>
      </div>
      
      <div className="flex items-center gap-2 text-primary font-semibold mt-3 group-hover:gap-3 transition-all">
        Découvrir
        <ChevronRight size={18} />
      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta(
      'LocaPlus - Marketplace Sécurisée pour Immobilier, Véhicules & Services',
      'LocaPlus : immobilier, véhicules, BTP, techniciens. Vendeurs vérifiés, paiement sécurisé Paystack/Djamo.'
    );

    const fetchRecentAnnouncements = async () => {
      setLoading(true);
      try {
        await new Promise((r) => setTimeout(r, 300));
        setAnnouncements(mockAnnouncements);
      } catch (error) {
        console.error('Erreur chargement annonces:', error);
        setAnnouncements(mockAnnouncements);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAnnouncements();
  }, []);

  return (
    <div className="bg-bg-primary">
      {/* ========== HERO SECTION ========== */}
      <section className="hero py-20 lg:py-32 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary opacity-10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-40 w-80 h-80 bg-accent opacity-5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-2 gap-12 items-center">
            {/* Left: Headline & CTA */}
            <div className="space-y-8 max-w-2xl">
              <div className="space-y-6">
                <span className="badge badge-primary inline-block">
                  <Sparkles size={14} />
                  Marketplace de Confiance
                </span>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
                  Trouvez Tout ce Dont vous Avez Besoin
                </h1>

                <p className="text-lg text-text-secondary max-w-lg leading-relaxed">
                  Immobilier, véhicules, matériaux de construction et services techniques. Une marketplace sécurisée avec vendeurs vérifiés et paiements certifiés.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/announcements" className="btn btn-primary btn-lg">
                  <TrendingUp size={20} />
                  Explorer les Annonces
                </Link>
                <Link to="/register" className="btn btn-secondary btn-lg">
                  <Plus size={20} />
                  Publier une Annonce
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border-color">
                <div>
                  <div className="text-2xl font-bold text-accent">12.5K+</div>
                  <div className="text-sm text-text-tertiary">Utilisateurs actifs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">2.3K+</div>
                  <div className="text-sm text-text-tertiary">Transactions/mois</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">99.9%</div>
                  <div className="text-sm text-text-tertiary">Sécurité SSL</div>
                </div>
              </div>
            </div>

            {/* Right: Visual Element */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Floating Card */}
                <div className="card bg-white p-8 space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-border-color">
                    <div className="w-16 h-16 rounded-xl bg-primary-lightest flex items-center justify-center">
                      <Award className="text-primary" size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">Catégories Premium</h3>
                      <p className="text-sm text-text-tertiary">4 secteurs de qualité</p>
                    </div>
                  </div>

                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-text-secondary">{cat.name}</span>
                      <ChevronRight size={18} className="text-text-tertiary" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CATEGORIES SECTION ========== */}
      <section className="py-20 lg:py-28 bg-bg-secondary">
        <div className="container">
          <div className="space-y-16">
            {/* Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary">
                Nos Catégories Principales
              </h2>
              <p className="text-lg text-text-secondary">
                Explorez les 4 secteurs majeurs de LocaPlus pour trouver exactement ce que vous cherchez
              </p>
            </div>

            {/* Categories Grid */}
            <div className="grid md:grid-3 lg:grid-4 gap-8">
              {categories.map((category) => (
                <CategoryCard 
                  key={category.id} 
                  category={category}
                  onNavigate={navigate}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== TRUST SECTION ========== */}
      <section className="py-20 lg:py-28 bg-bg-primary">
        <div className="container">
          <div className="space-y-16">
            {/* Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary">
                La Confiance au Cœur de LocaPlus
              </h2>
              <p className="text-lg text-text-secondary">
                Vos transactions et vos données sont protégées par les standards internationaux
              </p>
            </div>

            {/* Trust Cards */}
            <div className="grid md:grid-3 gap-8">
              {trustFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="card bg-gradient-to-br from-primary-lightest to-white p-8">
                    <div className="w-16 h-16 rounded-xl bg-primary-lightest flex items-center justify-center mb-6">
                      <Icon size={28} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========== RECENT ANNOUNCEMENTS SECTION ========== */}
      <section className="py-20 lg:py-28 bg-bg-secondary">
        <div className="container">
          <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-3">
                  Annonces Récentes
                </h2>
                <p className="text-lg text-text-secondary">
                  Découvrez les meilleures offres de notre communauté
                </p>
              </div>
              <Link to="/announcements" className="btn btn-primary btn-lg">
                Voir Toutes les Annonces
                <ArrowRight size={20} />
              </Link>
            </div>

            {/* Announcements Grid */}
            {loading ? (
              <div className="grid md:grid-2 lg:grid-3 gap-8">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="card h-96 bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : announcements.length > 0 ? (
              <div className="grid md:grid-2 lg:grid-3 gap-8">
                {announcements.slice(0, 6).map((announcement) => (
                  <AnnouncementCard 
                    key={announcement.id}
                    announcement={announcement}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA SECTION ========== */}
      <section className="py-20 lg:py-28 bg-bg-primary">
        <div className="container">
          <div className="bg-gradient-to-br from-primary to-primary-light rounded-3xl p-12 lg:p-16 text-center space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Prêt à Commencer ?
            </h2>
            <p className="text-lg text-primary-lightest max-w-2xl mx-auto">
              Rejoignez des milliers de vendeurs et d'acheteurs qui font confiance à LocaPlus pour leurs transactions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-lg bg-white text-primary hover:bg-slate-100">
                Créer un Compte Gratuit
                <ArrowRight size={20} />
              </Link>
              <Link to="/announcements" className="btn btn-lg border-2 border-white text-white hover:bg-white hover:bg-opacity-10">
                Parcourir les Annonces
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
