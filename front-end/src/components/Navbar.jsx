// filepath: front-end/src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/announcements', label: 'Annonces' },
    { to: '/help', label: 'Aide' },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact' },
  ];

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const handleMenuLink = (path, event) => {
    event.preventDefault();
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <nav className="navbar relative">
      <Link to="/" className="navbar-brand">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background */}
          <rect width="40" height="40" rx="8" fill="#1E3A5F"/>
          
          {/* Grid 2x2 - Top Left: Maison (Immobilier) */}
          <rect x="4" y="4" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.9"/>
          <path d="M11.5 9L8 12V16H15V12L11.5 9Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="14" r="0.8" fill="white"/>
          
          {/* Top Right: Voiture (Véhicules) */}
          <rect x="21" y="4" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.75"/>
          <path d="M24 11H32V13H24V11Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          <circle cx="26" cy="14.5" r="1.2" fill="white"/>
          <circle cx="30" cy="14.5" r="1.2" fill="white"/>
          
          {/* Bottom Left: Outils (Techniciens) */}
          <rect x="4" y="21" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.85"/>
          <path d="M8 28L12 24M12 24L14 26M14 26L10 30" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8" cy="28" r="1.2" fill="white"/>
          
          {/* Bottom Right: Briques (Matériaux) */}
          <rect x="21" y="21" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.8"/>
          <rect x="23" y="23" width="3" height="3" fill="white" rx="0.3"/>
          <rect x="28" y="23" width="3" height="3" fill="white" rx="0.3"/>
          <rect x="33" y="23" width="3" height="3" fill="white" rx="0.3"/>
          <rect x="23" y="28" width="3" height="3" fill="white" rx="0.3"/>
          <rect x="28" y="28" width="3" height="3" fill="white" rx="0.3"/>
          <rect x="33" y="28" width="3" height="3" fill="white" rx="0.3"/>
        </svg>
        LocaPlus
      </Link>

      {/* Bouton Hamburger pour Mobile */}
      <button
        className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isMenuOpen}
        aria-controls="navbar-mobile-drawer"
      >
        {isMenuOpen ? (
          <X size={24} className="transition-all duration-200" />
        ) : (
          <Menu size={24} className="transition-all duration-200" />
        )}
      </button>

      {/* Menu Desktop */}
      <div className="navbar-menu desktop-menu hidden md:flex">
        <Link to="/" className="navbar-link" onClick={handleNavClick}>Accueil</Link>
        <Link to="/announcements" className="navbar-link" onClick={handleNavClick}>Annonces</Link>
        <Link to="/help" className="navbar-link" onClick={handleNavClick}>Aide</Link>
        <Link to="/faq" className="navbar-link" onClick={handleNavClick}>FAQ</Link>
        <Link to="/contact" className="navbar-link" onClick={handleNavClick}>Contact</Link>
      </div>

      <div className="navbar-actions desktop-actions hidden md:flex">
        {user ? (
          <>
            <Link to="/create" className="btn btn-accent" onClick={handleNavClick}>
              + Publier
            </Link>
            <Link to="/dashboard" className="btn btn-ghost" onClick={handleNavClick}>
              Mon Dashboard
            </Link>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost" onClick={handleNavClick}>
              Connexion
            </Link>
            <Link to="/register" className="btn btn-primary" onClick={handleNavClick}>
              Inscription
            </Link>
          </>
        )}
      </div>

      <div className={`navbar-overlay md:hidden ${isMenuOpen ? 'open' : ''}`} onClick={handleNavClick} />

      <div
        id="navbar-mobile-drawer"
        className={`navbar-mobile-drawer flex flex-col md:hidden ${isMenuOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Menu mobile"
        aria-hidden={!isMenuOpen}
      >
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={(event) => handleMenuLink(link.to, event)}
            className={`navbar-mobile-link ${isActive(link.to) ? 'active' : ''}`}
            aria-current={isActive(link.to) ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}

        <div className="navbar-mobile-actions">
          {user ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={(event) => handleMenuLink('/dashboard', event)}>
                Mon Dashboard
              </button>
              <button type="button" className="btn btn-accent" onClick={(event) => handleMenuLink('/create', event)}>
                + Publier
              </button>
              <button type="button" className="btn btn-outline" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={(event) => handleMenuLink('/login', event)}>
                Connexion
              </button>
              <button type="button" className="btn btn-primary" onClick={(event) => handleMenuLink('/register', event)}>
                Inscription
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;