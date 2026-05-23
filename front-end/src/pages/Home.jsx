// filepath: front-end/src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  Car,
  HardHat,
  Wrench,
  Shield,
  CheckCircle,
  CreditCard,
  MapPin,
  Sparkles,
  Layers,
  ShieldCheck,
  BarChart3,
  Users,
  Globe,
  Phone,
  Eye,
  ChevronDown,
  Rocket,
  TrendingUp,
  Search,
  SlidersHorizontal,
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

// Données catégories avec images
const categories = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    description: 'Maisons, appartements, terrains',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'vehicule',
    name: 'Véhicules',
    description: 'Voitures, motos et utilitaires',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'materiaux',
    name: 'BTP',
    description: 'Matériaux et équipements de construction',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'technicien',
    name: 'Techniciens',
    description: 'Artisans, serruriers, électriciens, plombiers',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1050&q=80',
  },
];

// Tarifs professionnels
const professionalPricing = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: 'ri-home-line',
    price: '5,000',
    currency: 'FCFA',
    description: 'Annonce 30 jours · Visibilité standard',
    features: ['Publication 30 jours', 'Photos illimitées', 'Support client'],
    category: 'immobilier',
    popular: true,
  },
  {
    id: 'materiaux',
    name: 'Matériaux',
    icon: 'ri-building-line',
    price: '3,000',
    currency: 'FCFA',
    description: 'Annonce 30 jours · Visibilité standard',
    features: ['Publication 30 jours', 'Jusqu\'à 10 photos', 'Support client'],
    category: 'materiaux',
    popular: false,
  },
  {
    id: 'technicien',
    name: 'Technicien',
    icon: 'ri-tools-line',
    price: '2,000',
    currency: 'FCFA',
    description: 'Annonce 30 jours',
    features: ['Publication 30 jours', 'Jusqu\'à 5 photos', 'Support client'],
    category: 'technicien',
    popular: false,
  },
  {
    id: 'vehicule',
    name: 'Véhicule',
    icon: 'ri-car-line',
    price: '4,000',
    currency: 'FCFA',
    description: 'Annonce 30 jours',
    features: ['Publication 30 jours', 'Jusqu\'à 8 photos', 'Support client'],
    category: 'vehicule',
    popular: false,
  },
];

// Fonctionnalités sécurité
const securityFeatures = [
  {
    title: 'Données chiffrées',
    description: 'Toutes les conversations et les paiements sont protégés par SSL et chiffrement de bout en bout.',
    Icon: Shield,
  },
  {
    title: 'Vérification RSI',
    description: 'Vendeurs qualifiés et vérifiés pour renforcer la confiance sur chaque transaction.',
    Icon: CheckCircle,
  },
  {
    title: 'Paiement sécurisé',
    description: 'Intégration Paystack/Djamo pour des transactions fluides et sûres.',
    Icon: CreditCard,
  },
];

// Annonces mock (fallback si API down)
const mockAnnouncements = [
  {
    id: 1,
    title: 'Villa moderne à Cocody',
    description: 'Magnifique villa de 4 chambres avec piscine et jardin arboré, quartier résidentiel sécurisé.',
    price: '45,000,000 FCFA',
    location: 'Cocody, Abidjan',
    category: 'immobilier',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1229c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: 'Toyota RAV4 2020',
    description: 'SUV impeccable, full options, première main, entretien régulier en concession.',
    price: '12,500,000 FCFA',
    location: 'Treichville, Abidjan',
    category: 'vehicule',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    title: 'Ciment Portland 50kg',
    description: 'Lot de 100 sacs de ciment Portland de haute qualité, livraison disponible.',
    price: '6,500 FCFA/sac',
    location: 'Yopougon, Abidjan',
    category: 'materiaux',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    title: 'Électricien professionnel',
    description: 'Installation, rénovation et dépannage électrique résidentiel et commercial.',
    price: 'Sur devis',
    location: 'Plateau, Abidjan',
    category: 'technicien',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    title: 'Appartement F3 à louer',
    description: 'Bel appartement F3 lumineux, proche des commerces et transports en commun.',
    price: '350,000 FCFA/mois',
    location: 'Marcory, Abidjan',
    category: 'immobilier',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    title: 'Mercedes C300 2019',
    description: 'Berline premium, cuir noir, toit ouvrant, faible kilométrage.',
    price: '18,000,000 FCFA',
    location: 'Koumassi, Abidjan',
    category: 'vehicule',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homeError, setHomeError] = useState('');
  const [openContact, setOpenContact] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyActive, setNearbyActive] = useState(false);

  useEffect(() => {
    setPageMeta(
      'LocaPlus - Marketplace multi-services sécurisée',
      'LocaPlus : immobilier, véhicules, BTP, techniciens. Vendeurs vérifiés, paiement sécurisé Paystack/Djamo.'
    );

    // Simuler le chargement des annonces (remplace par ton API)
    const fetchRecentAnnouncements = async () => {
      setLoading(true);
      try {
        // Ici tu peux remettre ton vrai appel API :
        // const announcementsRes = await announcementService.getPublicAll({ limit: 6, page: 1 });
        // const results = announcementsRes.data?.announcements ?? [];
        // Pour l'instant, on utilise les mocks pour le design
        await new Promise((r) => setTimeout(r, 800));
        setAnnouncements(mockAnnouncements);
      } catch (error) {
        console.error('Erreur chargement annonces Home:', error);
        setAnnouncements(mockAnnouncements);
        setHomeError('Impossible de charger les annonces récentes. Mode démonstration activé.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAnnouncements();
  }, []);

  const handleNearby = () => {
    setNearbyLoading(true);
    setTimeout(() => {
      setNearbyLoading(false);
      setNearbyActive(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== HERO SECTION ========== */}
      <section className="w-full px-4 md:px-8 lg:px-12 pt-24 md:pt-32 pb-8 md:pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="order-1">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4">
                Fintech + Sécurité
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
                LocaPlus, la marketplace sécurisée pour vos services.
              </h1>
              <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                Immobilier, véhicules, BTP, techniciens — vendeurs vérifiés, paiement Paystack/Djamo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/announcements"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Explorer les annonces
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Publier une annonce
                </Link>
              </div>
            </div>

            {/* Right: Metrics Panel */}
            <div className="order-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </span>
                  <strong className="text-sm font-semibold text-gray-900">
                    {announcements.length} annonces actives
                  </strong>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Transactions/mois</p>
                      <p className="text-lg font-bold text-gray-900">2,345</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Utilisateurs</p>
                      <p className="text-lg font-bold text-gray-900">12.5K</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Pays opérationnels</p>
                      <p className="text-lg font-bold text-gray-900">25+</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Taux de sécurité</p>
                      <p className="text-lg font-bold text-gray-900">99.9%</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNearby}
                  className="w-full px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {nearbyActive ? 'Annonces à proximité activées' : 'Voir les annonces à proximité'}
                  {nearbyLoading && <span className="animate-spin">⟳</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== RECENT ANNOUNCEMENTS ========== */}
      <section className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Annonces récentes</h2>
              <p className="text-gray-600 mt-2">Découvrez les meilleures offres de notre communauté</p>
            </div>
            <Link to="/announcements" className="text-orange-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
              Voir tout <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
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
              <button onClick={() => window.location.reload()} className="btn btn-primary" type="button">
                Réessayer
              </button>
            </div>
          ) : announcements.length > 0 ? (
            <div className="announcements-grid" style={{ gap: 12 }}>
              {announcements.map((announcement) => (
                  <div
                    key={announcement._id || announcement.id || announcement.title}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/announcements/${announcement._id || announcement.id}`)}
                  >
                    <img src={announcement.image} alt={announcement.title} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 line-clamp-2">{announcement.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{announcement.location}</p>
                      <p className="text-orange-600 font-bold mt-3">{announcement.price}</p>
                    </div>
                  </div>
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
        </div>
      </section>

      {/* ========== PROFESSIONAL CTA ========== */}
      <section className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-blue-700 to-green-600 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Vous êtes professionnel ?</h2>
            <p className="text-white/95 text-lg">Rejoignez LocaPlus et atteignez des milliers de clients potentiels avec une publication sécurisée.</p>
          </div>
          <Link to="/register" className="btn btn-primary btn-lg whitespace-nowrap">
            Créer un compte gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;