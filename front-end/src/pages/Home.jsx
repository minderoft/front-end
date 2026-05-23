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

// Categories data with images
const categories = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    description: 'Maisons, appartements, terrains',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'vehicule',
    name: 'Vehicules',
    description: 'Voitures, motos et utilitaires',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'materiaux',
    name: 'BTP',
    description: 'Materiaux et equipements de construction',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1050&q=80',
  },
  {
    id: 'technicien',
    name: 'Techniciens',
    description: 'Artisans, serruriers, electriciens, plombiers',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1050&q=80',
  },
];

// Professional pricing
const professionalPricing = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: 'ri-home-line',
    price: '5,000',
    currency: 'FCFA',
    description: 'Annonce 30 jours · Visibilite standard',
    features: ['Publication 30 jours', 'Photos illimitees', 'Support client'],
    category: 'immobilier',
    popular: true,
  },
  {
    id: 'materiaux',
    name: 'Materiaux',
    icon: 'ri-building-line',
    price: '3,000',
    currency: 'FCFA',
    description: 'Annonce 30 jours · Visibilite standard',
    features: ['Publication 30 jours', 'Jusqua 10 photos', 'Support client'],
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
    features: ['Publication 30 jours', 'Jusqua 5 photos', 'Support client'],
    category: 'technicien',
    popular: false,
  },
  {
    id: 'vehicule',
    name: 'Vehicule',
    icon: 'ri-car-line',
    price: '4,000',
    currency: 'FCFA',
    description: 'Annonce 30 jours',
    features: ['Publication 30 jours', 'Jusqua 8 photos', 'Support client'],
    category: 'vehicule',
    popular: false,
  },
];

// Security features
const securityFeatures = [
  {
    title: 'Donnees chiffrees',
    description: 'Toutes les conversations et les paiements sont proteges par SSL et chiffrement de bout en bout.',
    Icon: Shield,
  },
  {
    title: 'Verification RSI',
    description: 'Vendeurs qualifies et verifies pour renforcer la confiance sur chaque transaction.',
    Icon: CheckCircle,
  },
  {
    title: 'Paiement securise',
    description: 'Integration Paystack/Djamo pour des transactions fluides et sures.',
    Icon: CreditCard,
  },
];

// Mock announcements (fallback if API down)
const mockAnnouncements = [
  {
    id: 1,
    title: 'Villa moderne a Cocody',
    description: 'Magnifique villa de 4 chambres avec piscine et jardin arbore, quartier residentiel securise.',
    price: '45,000,000 FCFA',
    location: 'Cocody, Abidjan',
    category: 'immobilier',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1229c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: 'Toyota RAV4 2020',
    description: 'SUV impeccable, full options, premiere main, entretien regulier en concession.',
    price: '12,500,000 FCFA',
    location: 'Treichville, Abidjan',
    category: 'vehicule',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    title: 'Ciment Portland 50kg',
    description: 'Lot de 100 sacs de ciment Portland de haute qualite, livraison disponible.',
    price: '6,500 FCFA/sac',
    location: 'Yopougon, Abidjan',
    category: 'materiaux',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    title: 'Electricien professionnel',
    description: 'Installation, renovation et depannage electrique residentiel et commercial.',
    price: 'Sur devis',
    location: 'Plateau, Abidjan',
    category: 'technicien',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    title: 'Appartement F3 a louer',
    description: 'Bel appartement F3 lumineux, proche des commerces et transports en commun.',
    price: '350,000 FCFA/mois',
    location: 'Marcory, Abidjan',
    category: 'immobilier',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    title: 'Mercedes C300 2019',
    description: 'Berline premium, cuir noir, toit ouvrant, faible kilometrage.',
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
      'LocaPlus - Marketplace multi-services securisee',
      'LocaPlus : immobilier, vehicules, BTP, techniciens. Vendeurs verifies, paiement securise Paystack/Djamo.'
    );

    const fetchRecentAnnouncements = async () => {
      setLoading(true);
      try {
        await new Promise((r) => setTimeout(r, 800));
        setAnnouncements(mockAnnouncements);
      } catch (error) {
        console.error('Erreur chargement annonces Home:', error);
        setAnnouncements(mockAnnouncements);
        setHomeError('Impossible de charger les annonces recentes. Mode demonstration active.');
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
    <div className="min-h-screen bg-white">
      {/* ========== HERO SECTION ========== */}
      <section className="w-full bg-gradient-to-b from-blue-50 via-white to-white px-5 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="order-1 space-y-6">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">
                Fintech + Securite
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                LocaPlus, la marketplace securisee pour vos services.
              </h1>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-xl">
                Immobilier, vehicules, BTP, techniciens - vendeurs verifies, paiement Paystack/Djamo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/announcements"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md block text-center transition-colors"
                >
                  Explorer les annonces
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 font-semibold py-3 px-8 rounded-lg block text-center bg-transparent hover:bg-blue-50 transition-colors"
                >
                  Publier une annonce
                </Link>
              </div>
            </div>

            {/* Right: Metrics Panel */}
            <div className="order-2">
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Performance
                  </span>
                  <strong className="text-sm font-bold text-blue-600">
                    {announcements.length} annonces actives
                  </strong>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Transactions/mois</p>
                      <p className="text-lg font-bold text-gray-900">2,345</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Utilisateurs</p>
                      <p className="text-lg font-bold text-gray-900">12.5K</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Pays operationnels</p>
                      <p className="text-lg font-bold text-gray-900">25+</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Taux de securite</p>
                      <p className="text-lg font-bold text-gray-900">99.9%</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNearby}
                  className="w-full px-4 py-3 text-sm font-bold text-white bg-blue-600 border-0 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <MapPin className="w-4 h-4" />
                  {nearbyActive ? 'Annonces a proximite activees' : 'Voir les annonces a proximite'}
                  {nearbyLoading && <span className="animate-spin">+</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== RECENT ANNOUNCEMENTS ========== */}
      <section className="w-full px-5 py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Annonces recentes</h2>
              <p className="text-gray-700 mt-2 font-medium">Decouvrez les meilleures offres de notre communaute</p>
            </div>
            <Link to="/announcements" className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all text-sm">
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
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
              <p className="text-red-800 font-semibold">{homeError}</p>
              <button onClick={() => window.location.reload()} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors" type="button">
                Reessayer
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
                      <p className="text-blue-600 font-bold mt-3">{announcement.price}</p>
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center space-y-4">
              <p className="text-gray-700 font-semibold text-lg">Aucune annonce pour le moment. Soyez le premier a publier !</p>
              <Link to="/create" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Publier une annonce
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ========== PROFESSIONAL CTA ========== */}
      <section className="w-full px-5 py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Vous etes professionnel ?</h2>
            <p className="text-blue-100 text-lg font-medium">Rejoignez LocaPlus et atteignez des milliers de clients potentiels avec une publication securisee.</p>
          </div>
          <Link to="/register" className="w-full sm:w-auto bg-white hover:bg-blue-50 text-blue-700 font-bold py-4 px-8 rounded-lg whitespace-nowrap block text-center transition-colors shadow-lg">
            Creer un compte gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;