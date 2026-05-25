import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  MessageCircle,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Plus,
  Search,
  MapPin,
  Heart,
  User,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import './Navbar.css';

const categories = [
  { id: 'immobilier', name: 'Immobilier' },
  { id: 'vehicule', name: 'Véhicules' },
  { id: 'materiaux', name: 'Matériaux BTP' },
  { id: 'technicien', name: 'Techniciens' },
  { id: 'services', name: 'Services' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        setIsCategoriesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsCategoriesOpen(false);
  }, [location]);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">🏠</div>
            <span className="navbar-logo-text">LocaPlus</span>
          </Link>

          {/* Search Bar (Desktop Only) */}
          <div className="navbar-search-desktop hidden-mobile">
            <div className="navbar-search-wrapper">
              <Search className="navbar-search-icon" size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                className="navbar-search-input"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="navbar-right">
            {/* Categories Dropdown (Desktop) */}
            <div className="navbar-categories hidden-mobile">
              <button
                className="navbar-categories-toggle"
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              >
                <ShoppingBag size={18} />
                <span>Catégories</span>
                <ChevronDown size={16} className={isCategoriesOpen ? 'open' : ''} />
              </button>

              {isCategoriesOpen && (
                <div className="navbar-categories-menu">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/announcements?category=${cat.id}`}
                      className="navbar-categories-item"
                      onClick={() => setIsCategoriesOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Icons Section */}
            <div className="navbar-icons">
              {user && (
                <>
                  <Link
                    to="/messages"
                    className={`navbar-icon-btn ${isActive('/messages') ? 'active' : ''}`}
                    title="Messages"
                  >
                    <MessageCircle size={20} />
                    {unreadMessages > 0 && (
                      <span className="navbar-badge">{unreadMessages}</span>
                    )}
                  </Link>

                  <Link
                    to="/notifications"
                    className={`navbar-icon-btn ${isActive('/notifications') ? 'active' : ''}`}
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {notificationCount > 0 && (
                      <span className="navbar-badge">{notificationCount}</span>
                    )}
                  </Link>

                  <Link
                    to="/favorites"
                    className={`navbar-icon-btn ${isActive('/favorites') ? 'active' : ''}`}
                    title="Favoris"
                  >
                    <Heart size={20} />
                  </Link>
                </>
              )}

              <Link to="/help" className="navbar-icon-btn" title="Aide">
                <HelpCircle size={20} />
              </Link>
            </div>

            {/* Publish Button */}
            <Button
              variant="cta"
              size="md"
              className="navbar-publish-btn hidden-mobile"
              onClick={() => navigate('/create')}
              icon={Plus}
            >
              Publier
            </Button>

            {/* Auth Section */}
            {user ? (
              <div className="navbar-user-section">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="navbar-user-btn"
                  title={user.name}
                >
                  <div className="navbar-avatar">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="navbar-username hidden-mobile">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`navbar-chevron ${isUserMenuOpen ? 'open' : ''}`}
                  />
                </button>

                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="navbar-user-menu">
                    <div className="navbar-user-header">
                      <div className="navbar-user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                      <div>
                        <div className="navbar-user-name">{user.name}</div>
                        <div className="navbar-user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="navbar-menu-divider"></div>
                    <Link
                      to="/dashboard"
                      className="navbar-menu-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Home size={18} />
                      <span>Tableau de bord</span>
                    </Link>
                    <Link
                      to="/my-listings"
                      className="navbar-menu-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <ShoppingBag size={18} />
                      <span>Mes annonces</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="navbar-menu-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={18} />
                      <span>Mon profil</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="navbar-menu-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={18} />
                      <span>Paramètres</span>
                    </Link>
                    <Link
                      to="/help"
                      className="navbar-menu-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <HelpCircle size={18} />
                      <span>Aide</span>
                    </Link>
                    <div className="navbar-menu-divider"></div>
                    <button
                      onClick={handleLogout}
                      className="navbar-menu-item navbar-menu-item--danger"
                    >
                      <LogOut size={18} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar-auth-buttons">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => navigate('/login')}
                  className="hidden-mobile"
                >
                  Connexion
                </Button>
                <Button
                  variant="cta"
                  size="md"
                  onClick={() => navigate('/register')}
                >
                  Inscription
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="navbar-mobile-toggle visible-mobile"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search Bar Mobile */}
        <div className="navbar-search-mobile visible-mobile">
          <div className="navbar-search-wrapper">
            <Search className="navbar-search-icon" size={20} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="navbar-search-input"
            />
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <Link
            to="/"
            className={`navbar-mobile-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Home size={18} />
            <span>Accueil</span>
          </Link>
          <Link
            to="/announcements"
            className={`navbar-mobile-item ${isActive('/announcements') ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <ShoppingBag size={18} />
            <span>Annonces</span>
          </Link>

          {/* Mobile Categories */}
          <button
            className="navbar-mobile-item"
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          >
            <ShoppingBag size={18} />
            <span>Catégories</span>
            <ChevronDown size={16} className={isCategoriesOpen ? 'open' : ''} />
          </button>
          {isCategoriesOpen && (
            <div className="navbar-mobile-categories">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/announcements?category=${cat.id}`}
                  className="navbar-mobile-category-item"
                  onClick={() => {
                    setIsCategoriesOpen(false);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {user && (
            <>
              <Link
                to="/create"
                className="navbar-mobile-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Plus size={18} />
                <span>Publier une annonce</span>
              </Link>
              <Link
                to="/dashboard"
                className="navbar-mobile-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={18} />
                <span>Tableau de bord</span>
              </Link>
            </>
          )}

          <div className="navbar-mobile-divider"></div>

          <Link
            to="/help"
            className="navbar-mobile-item"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <HelpCircle size={18} />
            <span>Aide</span>
          </Link>

          {!user && (
            <div className="navbar-mobile-auth">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  navigate('/login');
                  setIsMobileMenuOpen(false);
                }}
              >
                Connexion
              </Button>
              <Button
                variant="cta"
                size="md"
                onClick={() => {
                  navigate('/register');
                  setIsMobileMenuOpen(false);
                }}
              >
                Inscription
              </Button>
            </div>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className="navbar-mobile-logout"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
