// filepath: front-end/src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, ShoppingBag, MessageCircle, Bell, HelpCircle,
  LogOut, ChevronDown, Menu, X, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="navbar-premium">
        <div className="navbar-container">
          {/* Left: Logo */}
          <div className="navbar-left">
            <Link to="/" className="navbar-logo">
              <div className="navbar-logo-icon">
                <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="8" fill="currentColor" opacity="0.1"/>
                  <rect x="4" y="4" width="15" height="15" rx="2" fill="currentColor" opacity="0.8"/>
                  <path d="M11.5 9L8 12V16H15V12L11.5 9Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="14" r="0.8" fill="currentColor"/>
                  <rect x="21" y="4" width="15" height="15" rx="2" fill="currentColor" opacity="0.6"/>
                  <path d="M24 11H32V13H24V11Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <circle cx="26" cy="14.5" r="1.2" fill="currentColor"/>
                  <circle cx="30" cy="14.5" r="1.2" fill="currentColor"/>
                </svg>
              </div>
              <span className="navbar-logo-text">LocaPlus</span>
            </Link>
          </div>

          {/* Center: Main Navigation (Desktop) */}
          <div className="navbar-center hidden-mobile">
            <Link to="/" className={`navbar-nav-item ${isActive('/') ? 'active' : ''}`}>
              <Home size={18} />
              <span>Accueil</span>
            </Link>
            <Link to="/announcements" className={`navbar-nav-item ${isActive('/announcements') ? 'active' : ''}`}>
              <ShoppingBag size={18} />
              <span>Annonces</span>
            </Link>
            <a href="#features" className="navbar-nav-item">
              <span>Caractéristiques</span>
            </a>
          </div>

          {/* Right: Action Items */}
          <div className="navbar-right">
            {/* Icons Navigation (Desktop) */}
            <div className="navbar-icons hidden-mobile">
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
                </>
              )}
            </div>

            {/* Primary CTA: Publish */}
            {user && (
              <Link to="/create" className="btn btn-primary btn-md hidden-mobile">
                <Plus size={18} />
                Publier
              </Link>
            )}

            {/* Auth Section */}
            {user ? (
              <div className="navbar-user-section">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="navbar-user-btn"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="navbar-avatar">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="navbar-username hidden-mobile">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={16} className={`navbar-chevron ${isUserMenuOpen ? 'open' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="navbar-dropdown">
                    <div className="navbar-dropdown-header">
                      <div className="navbar-dropdown-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                      <div>
                        <div className="navbar-dropdown-name">{user.name}</div>
                        <div className="navbar-dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="navbar-dropdown-divider"></div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="navbar-dropdown-item"
                    >
                      <Home size={16} />
                      Mon Dashboard
                    </Link>
                    <Link
                      to="/create"
                      className="navbar-dropdown-item visible-mobile"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Plus size={16} />
                      Publier une annonce
                    </Link>
                    <Link
                      to="/messages"
                      className="navbar-dropdown-item visible-mobile"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <MessageCircle size={16} />
                      Messages
                    </Link>
                    <Link
                      to="/help"
                      className="navbar-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <HelpCircle size={16} />
                      Aide et support
                    </Link>
                    <div className="navbar-dropdown-divider"></div>
                    <button
                      onClick={handleLogout}
                      className="navbar-dropdown-item navbar-dropdown-item--danger"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar-auth-buttons">
                <Link to="/login" className="btn btn-text btn-md hidden-mobile">
                  Se connecter
                </Link>
                <Link to="/register" className="btn btn-primary btn-md">
                  S'inscrire
                </Link>
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
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/" className={`navbar-mobile-item ${isActive('/') ? 'active' : ''}`}>
            <Home size={18} />
            Accueil
          </Link>
          <Link to="/announcements" className={`navbar-mobile-item ${isActive('/announcements') ? 'active' : ''}`}>
            <ShoppingBag size={18} />
            Annonces
          </Link>
          <a href="#features" className="navbar-mobile-item">
            Caractéristiques
          </a>
          {!user && (
            <>
              <div className="navbar-mobile-divider"></div>
              <Link to="/help" className="navbar-mobile-item">
                <HelpCircle size={18} />
                Aide
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
