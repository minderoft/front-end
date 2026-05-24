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

const categories = [
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: HomeIcon,
  },
  {
    id: 'vehicule',
    name: 'Véhicules',
    icon: Car,
  },
  {
    id: 'materiaux',
    name: 'BTP',
    icon: HardHat,
  },
  {
    id: 'technicien',
    name: 'Techniciens',
    icon: Wrench,
  },
];

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

const CategoryCard = ({ category, onNavigate }) => {
  const Icon = category.icon;

  return (
    <button
      onClick={() => onNavigate(`/announcements?category=${category.id}`)}
      className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-xl p-5 flex flex-col items-center text-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <Icon className="w-8 h-8 text-blue-600 mb-3" />
      <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
        {category.name}
      </span>
    </button>
  );
};

const AnnouncementCard = ({ announcement, onNavigate }) => {
  return (
    <button
      onClick={() => onNavigate(`/announcements/${announcement.id}`)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left"
    >
      <div className="relative h-56 overflow-hidden bg-gray-100">
        <img
          src={announcement.image}
          alt={announcement.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {announcement.featured && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Star size={12} fill="currentColor" />
            En vedette
          </div>
        )}
        {announcement.verified && (
          <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle size={12} />
            Vérifié
          </div>
        )}
      </div>

      <div className="p-5">
        <span className="inline-block text-xs font-bold uppercase text-blue-600 mb-2 tracking-widest">
          {announcement.category}
        </span>

        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {announcement.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {announcement.description}
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="truncate">{announcement.location}</span>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="text-lg font-bold text-blue-600">
            {announcement.price}
            {announcement.currency && (
              <span className="text-xs font-medium text-gray-500 ml-2">{announcement.currency}</span>
            )}
          </div>
        </div>
      </div>
    </button>
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
    <div className="w-full min-h-screen bg-gray-50/50 flex flex-col pt-20 sm:pt-24">
      {/* HERO BANNER SECTION */}
      <section className="w-full px-4 sm:px-8 my-6">
        <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-6 sm:px-8 rounded-2xl shadow-sm text-center">
          <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold mb-4 leading-tight">
            Trouvez un service ou un bien en Côte d'Ivoire
          </h1>
          <p className="text-base md:text-lg text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Immobilier, véhicules, matériaux de construction et services techniques. Une marketplace sécurisée avec vendeurs vérifiés.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/announcements"
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
            >
              Explorer les annonces
            </Link>
            <Link
              to="/register"
              className="border-2 border-white text-white font-bold py-3 px-8 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
            >
              Publier une annonce
            </Link>
          </div>
        </div>
      </section>

      {/* VISUAL CATEGORIES GRID */}
      <section className="w-full px-4 sm:px-8 my-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">
          Navigation visuelle par catégorie
        </h2>
        <div className="grid grid-cols-2 gap-4 w-full sm:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onNavigate={navigate}
            />
          ))}
        </div>
      </section>

      {/* STATS & FEATURES GRID */}
      <section className="w-full border-y border-gray-100 py-8 my-6">
        <div className="w-full px-4 sm:px-8">
          <div className="grid grid-cols-3 gap-4 w-full text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">12+</div>
              <div className="text-xs text-gray-500 font-medium tracking-widest uppercase mt-1">
                Annonces
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-xs text-gray-500 font-medium tracking-widest uppercase mt-1">
                Catégories
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className="text-xs text-gray-500 font-medium tracking-widest uppercase mt-1">
                Sécurisé
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT ANNOUNCEMENTS SECTION */}
      <section className="w-full px-4 sm:px-8 py-12">
        <div className="w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Annonces Récentes
              </h2>
              <p className="text-base text-gray-600">
                Découvrez les meilleures offres de notre communauté
              </p>
            </div>
            <Link
              to="/announcements"
              className="hidden md:inline-flex bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all items-center gap-2 whitespace-nowrap shadow-sm"
            >
              Voir Toutes les Annonces
              <ArrowRight size={20} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl h-96 animate-pulse shadow-sm"
                />
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.slice(0, 6).map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onNavigate={navigate}
                />
              ))}
            </div>
          ) : null}

          <div className="md:hidden">
            <Link
              to="/announcements"
              className="w-full block bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all text-center shadow-sm"
            >
              Voir Toutes les Annonces
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST & SECURITY SECTION */}
      <section className="w-full px-4 sm:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-center">
              La Confiance au Cœur de LocaPlus
            </h2>
            <p className="text-base text-gray-600 text-center max-w-2xl mx-auto">
              Vos transactions et vos données sont protégées par les standards internationaux
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <Shield size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Paiements Sécurisés
              </h3>
              <p className="text-sm text-gray-600">
                Transactions protégées avec Paystack et Djamo pour votre tranquillité
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <CheckCircle size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Vendeurs Vérifiés
              </h3>
              <p className="text-sm text-gray-600">
                Tous nos vendeurs sont validés et certifiés pour garantir la qualité
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <Lock size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Données Chiffrées
              </h3>
              <p className="text-sm text-gray-600">
                Vos conversations et données sont protégées par SSL de bout en bout
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="w-full px-4 sm:px-8 py-12">
        <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-center space-y-6 text-white shadow-sm">
          <h2 className="text-3xl md:text-4xl font-bold">
            Prêt à Commencer ?
          </h2>
          <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto">
            Rejoignez des milliers de vendeurs et d'acheteurs qui font confiance à LocaPlus pour leurs transactions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              Créer un Compte Gratuit
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/announcements"
              className="border-2 border-white text-white font-bold py-3 px-8 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 justify-center"
            >
              Parcourir les Annonces
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
