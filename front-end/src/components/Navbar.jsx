// filepath: front-end/src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
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
        className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Menu Desktop et Mobile */}
      <div className={`navbar-dropdown ${menuOpen ? 'active' : ''}`}>
        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-link" onClick={handleNavClick}>Accueil</Link>
          <Link to="/announcements" className="navbar-link" onClick={handleNavClick}>Annonces</Link>
          <Link to="/help" className="navbar-link" onClick={handleNavClick}>Aide</Link>
          <Link to="/faq" className="navbar-link" onClick={handleNavClick}>FAQ</Link>
          <Link to="/contact" className="navbar-link" onClick={handleNavClick}>Contact</Link>
        </div>

        <div className={`navbar-actions ${menuOpen ? 'active' : ''}`}>
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
      </div>
    </nav>
  );
};

export default Navbar;