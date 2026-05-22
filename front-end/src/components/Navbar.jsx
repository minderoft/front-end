// filepath: front-end/src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, MessageCircle, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsHelpMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">

          {/* Logo */}
          <Link to="/" className="navbar-brand">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#1E3A5F"/>
              <rect x="4" y="4" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.9"/>
              <path d="M11.5 9L8 12V16H15V12L11.5 9Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="14" r="0.8" fill="white"/>
              <rect x="21" y="4" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.75"/>
              <path d="M24 11H32V13H24V11Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              <circle cx="26" cy="14.5" r="1.2" fill="white"/>
              <circle cx="30" cy="14.5" r="1.2" fill="white"/>
              <rect x="4" y="21" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.85"/>
              <path d="M8 28L12 24M12 24L14 26M14 26L10 30" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="28" r="1.2" fill="white"/>
              <rect x="21" y="21" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.8"/>
              <rect x="23" y="23" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="28" y="23" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="33" y="23" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="23" y="28" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="28" y="28" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="33" y="28" width="3" height="3" fill="white" rx="0.3"/>
            </svg>
            <span className="navbar-brand-text">LocaPlus</span>
          </Link>

          {/* Navigation Icons */}
          <div className="navbar-nav">
            <Link
              to="/"
              className={`navbar-nav-link${isActive('/') ? ' active' : ''}`}
              title="Accueil"
            >
              <Home size={24} />
            </Link>
            <Link
              to="/announcements"
              className={`navbar-nav-link${isActive('/announcements') ? ' active' : ''}`}
              title="Annonces"
            >
              <ShoppingBag size={24} />
            </Link>
            <Link
              to="/messages"
              className={`navbar-nav-link${isActive('/messages') ? ' active' : ''}`}
              title="Messages"
            >
              <MessageCircle size={24} />
              {unreadMessages > 0 && (
                <span className="navbar-badge">{unreadMessages}</span>
              )}
            </Link>
            <Link
              to="/notifications"
              className={`navbar-nav-link${isActive('/notifications') ? ' active' : ''}`}
              title="Notifications"
            >
              <Bell size={24} />
              {notificationCount > 0 && (
                <span className="navbar-badge">{notificationCount}</span>
              )}
            </Link>
            <button
              onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
              className={`navbar-nav-link${isHelpMenuOpen ? ' active' : ''}`}
              title="Aide"
              aria-expanded={isHelpMenuOpen}
              aria-haspopup="true"
            >
              <HelpCircle size={24} />
            </button>
          </div>

          {/* Desktop Auth Actions */}
          <div className="navbar-auth">
            {user ? (
              <div className="navbar-user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="navbar-user-btn"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menu utilisateur"
                >
                  <div className="navbar-avatar">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="navbar-username">{user.name}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="navbar-dropdown" role="menu">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="navbar-dropdown-item"
                      role="menuitem"
                    >
                      Mon Dashboard
                    </Link>
                    <Link
                      to="/create"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="navbar-dropdown-item navbar-dropdown-item--highlight"
                      role="menuitem"
                    >
                      + Publier une annonce
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="navbar-dropdown-item navbar-dropdown-item--separator"
                      role="menuitem"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Inscription
                </Link>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* Help Dropdown */}
      {isHelpMenuOpen && !['/help', '/faq', '/contact'].includes(location.pathname) && (
        <div className="navbar-help-dropdown" role="menu">
          <Link
            to="/help"
            onClick={() => setIsHelpMenuOpen(false)}
            className="navbar-dropdown-item"
            role="menuitem"
          >
            Aide
          </Link>
          <Link
            to="/faq"
            onClick={() => setIsHelpMenuOpen(false)}
            className="navbar-dropdown-item"
            role="menuitem"
          >
            FAQ
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsHelpMenuOpen(false)}
            className="navbar-dropdown-item"
            role="menuitem"
          >
            Contact
          </Link>
        </div>
      )}
    </>
  );
};

export default Navbar;
