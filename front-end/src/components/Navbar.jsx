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

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="8" fill="#1E3A5F"/>
          <path d="M20 8L8 18V32H16V24H24V32H32V18L20 8Z" fill="#FF6B35"/>
          <path d="M20 12L12 18V28H18V22H22V28H28V18L20 12Z" fill="white"/>
        </svg>
        LocaPlus
      </Link>

      <div className="navbar-menu">
        <Link to="/" className="navbar-link">Accueil</Link>
        <Link to="/announcements" className="navbar-link">Annonces</Link>
        <Link to="/help" className="navbar-link">Aide</Link>
        <Link to="/contact" className="navbar-link">Contact</Link>
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            <Link to="/create" className="btn btn-accent">
              + Publier
            </Link>
            <Link to="/dashboard" className="btn btn-ghost">
              Mon Dashboard
            </Link>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              Connexion
            </Link>
            <Link to="/register" className="btn btn-primary">
              Inscription
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;